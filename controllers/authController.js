const User = require('../models/User');
const UserUnverified = require('../models/UserUnverified');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/sendEmail');

//@desc     Register user
//@route    POST /api/v1/auth/register
//@access   Public
exports.register=async (req,res,next)=>{ 
    try{
        const {name, email, password, telephone, role}=req.body;
        
        // Check if user already exists in verified users
        const existingUser = await User.findOne({$or: [{email}, {telephone}]});
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or telephone already exists'
            });
        }

        // Check if user already exists in unverified users
        const existingUnverifiedUser = await UserUnverified.findOne({email});
        
        // Check rate limiting for existing unverified users
        if (existingUnverifiedUser) {
            const timeSinceLastToken = Date.now() - existingUnverifiedUser.lastTokenSent.getTime();
            if (timeSinceLastToken < 90000) { // 90000
                const waitTime = Math.ceil((90000 - timeSinceLastToken) / 1000);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${waitTime} seconds before requesting a new verification token`
                });
            }
        }

        // Generate verification token (6-digit number)
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpire = new Date(Date.now() + 600000); // 10 minutes
        
        let userUnverified;
        if (existingUnverifiedUser) {
            // For existing users, we need to manually handle hashing since pre('save') doesn't run on findByIdAndUpdate
            existingUnverifiedUser.name = name;
            existingUnverifiedUser.telephone = telephone;
            existingUnverifiedUser.password = password;
            existingUnverifiedUser.role = role;
            existingUnverifiedUser.verificationToken = verificationToken;
            existingUnverifiedUser.verificationExpire = verificationExpire;
            existingUnverifiedUser.lastTokenSent = new Date();
            existingUnverifiedUser.mistakes = 0;
            
            // Save to trigger pre('save') middleware for hashing
            userUnverified = await existingUnverifiedUser.save();
        } else {
            // Create new unverified user
            userUnverified = await UserUnverified.create({
                name, 
                email,
                telephone,
                password, 
                role,
                verificationToken,
                verificationExpire,
                lastTokenSent: new Date(),
                mistakes: 0
            });
        }

        // Send verification email with plaintext token
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            success: true,
            message: existingUnverifiedUser 
                ? 'New verification token sent. Please check your email for verification.'
                : 'Registration successful. Please check your email for verification.'
        });
    } catch(err){ 
        res.status(400).json({success:false, message: err.message}); 
        console.log(err.stack);
    }
};

//@desc     Login user
//@route    POST /api/v1/auth/login
//@access   Public
exports.login=async (req,res,next)=>{
    const {email, password}=req.body;

    //Validate email & password
    if(!email || !password){
        return res.status(400).json({success:false,
        msg:'Please provide an email and password'});
    }

    //Check for user
    const user = await 
    User.findOne({email}).select('+password');

    if(!user){
        return res.status(400).json({success:false,
        msg:'Invalid credentials'});
    }

    //Check if password matches
    const isMatch = await user.matchPassword(password);

    if(!isMatch){
        return res.status(401).json({success:false,
        msg:'Invalid credentials'});
    }

    //Create token
    const token=user.getSignedJwtToken();
    sendTokenResponse(user, 200, res);

    res.status(200).json({success:true,token});
};

//@desc     Logout user
//@route    GET /api/v1/auth/logout
//@access   Public
exports.logout=async (req,res,next)=>{
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};

//Get token from model, create cookie and send response to client
const sendTokenResponse=(user, statusCode, res)=>{
    //Create token
    const token=user.getSignedJwtToken();

    const options = {
        expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRE*24*60*60*1000), //set as milliseconds
        httpOnly: true
    };

    if(process.env.NODE_ENV==='production'){
        options.secure=true;
    }
    res.status(statusCode).cookie('token',token,options).json({
        success: true,
        token
    })
}

//@desc Get current Logged in user
//@route POST /api/vl/auth/me
//@access Private
exports.getMe=async(req, res, next)=>{
    const user=await User.findById(req.user.id);
    res.status(200).json({
        success:true, 
        data:user
    });
};

//@desc     Verify user email
//@route    POST /api/v1/auth/verify
//@access   Public
exports.verifyUser = async (req, res, next) => {
    try {
        const { email, verificationToken } = req.body;

        if (!email || !verificationToken) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and verification token'
            });
        }

        // Hash the provided token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        // Find unverified user
        const unverifiedUser = await UserUnverified.findOne({
            email,
            verificationToken: hashedToken,
            verificationExpire: { $gt: Date.now() }
        }).select('+password');

        if (!unverifiedUser) {
            // Find user to increment mistakes counter
            const userForMistake = await UserUnverified.findOne({ email });
            
            if (userForMistake) {
                const newMistakeCount = userForMistake.mistakes + 1;
                
                if (newMistakeCount >= 5) {
                    // Delete user after 5 wrong attempts
                    await UserUnverified.findByIdAndDelete(userForMistake._id);
                    return res.status(400).json({
                        success: false,
                        message: 'Too many failed attempts. Please register again.'
                    });
                } else {
                    // Increment mistake counter
                    await UserUnverified.findByIdAndUpdate(userForMistake._id, {
                        mistakes: newMistakeCount
                    });
                    return res.status(400).json({
                        success: false,
                        message: `Invalid verification token. ${5 - newMistakeCount} attempts remaining.`
                    });
                }
            }
            
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Create verified user
        const verifiedUser = await User.create({
            name: unverifiedUser.name,
            email: unverifiedUser.email,
            telephone: unverifiedUser.telephone,
            password: unverifiedUser.password,
            role: unverifiedUser.role
        });

        // Delete from unverified collection
        await UserUnverified.findByIdAndDelete(unverifiedUser._id);

        // Generate token for immediate login
        const token = verifiedUser.getSignedJwtToken();
        sendTokenResponse(verifiedUser, 200, res);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
};