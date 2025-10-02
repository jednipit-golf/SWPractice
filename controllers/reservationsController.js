const Reservation = require('../models/Reservation');
const MassageShop = require('../models/MassageShop');

//@desc     Get all reservations
//@route    GET /api/v1/reservations
//@access   Private
exports.getReservations = async (req, res, next) => {
    try {
        let query;

        // If user is not admin, can only see own reservations
        if (req.user.role !== 'admin') {
            query = Reservation.find({ user: req.user.id }).populate({
                path: 'massageShop',
                select: 'name address telephone openTime closeTime'
            });
        } else {
            // Admin can see all reservations
            query = Reservation.find().populate({
                path: 'massageShop',
                select: 'name address telephone openTime closeTime'
            }).populate({
                path: 'user',
                select: 'name email'
            });
        }

        const reservations = await query;

        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Cannot find reservations'
        });
    }
};

//@desc     Get single reservation
//@route    GET /api/v1/reservations/:id
//@access   Private
exports.getReservationsById = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'massageShop',
            select: 'name address telephone openTime closeTime'
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'No reservation with the id of ' + req.params.id
            });
        }

        // Make sure user is reservation owner or admin
        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'User ' + req.user.id + ' is not authorized to view this reservation'
            });
        }

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Cannot find reservation'
        });
    }
};

//@desc     Add reservation
//@route    POST /api/v1/reservations
//@access   Private
exports.addReservations = async (req, res, next) => {
    try {
        req.body.user = req.user.id;

        // Check for existing reservations
        const existingReservations = await Reservation.find({ user: req.user.id });

        // If the user is not an admin, they can only create 3 reservations
        if (existingReservations.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 reservations`
            });
        }

        const reservation = await Reservation.create(req.body);

        res.status(201).json({
            success: true,
            data: reservation
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Cannot create reservation'
        });
    }
};

//@desc     Update reservation
//@route    PUT /api/v1/reservations/:id
//@access   Private
exports.updateReservations = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'No reservation with the id of ' + req.params.id
            });
        }

        // Make sure user is reservation owner or admin
        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'User ' + req.user.id + ' is not authorized to update this reservation'
            });
        }

        reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Cannot update reservation'
        });
    }
};

//@desc     Delete reservation
//@route    DELETE /api/v1/reservations/:id
//@access   Private
exports.deleteReservations = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'No reservation with the id of ' + req.params.id
            });
        }

        // Make sure user is reservation owner or admin
        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'User ' + req.user.id + ' is not authorized to delete this reservation'
            });
        }

        await reservation.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Cannot delete reservation'
        });
    }
};
