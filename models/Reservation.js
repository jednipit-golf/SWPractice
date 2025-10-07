const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    apptDate: {
        type: String,
        required: [true, 'Please add appointment date'],
        match: [
            /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/,
            'Please add valid date format (DD-MM-YYYY)'
        ]
    },
    apptTime: {
        type: String,
        required: [true, 'Please add appointment time'],
        match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Please add valid time format (HH:MM)'
        ]
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    massageShop: {
        type: mongoose.Schema.ObjectId,
        ref: 'MassageShop',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index to improve query performance
ReservationSchema.index({ user: 1 });

// Validate that user doesn't exceed 3 reservations
ReservationSchema.pre('save', async function (next) {
    const reservationCount = await this.constructor.countDocuments({ user: this.user });

    if (reservationCount >= 3) {
        const error = new Error('User cannot have more than 3 reservations');
        return next(error);
    }
    next();
});

module.exports = mongoose.model('Reservation', ReservationSchema);
