// Convert time string (HH:MM) to minutes for comparison
const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

// ดึงชั่วโมง/นาทีตาม timezone ไทยจริง ๆ
const getThailandTimeParts = (date) => {
    const options = {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(date);

    const hours = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const minutes = parseInt(parts.find(p => p.type === 'minute').value, 10);

    return { hours, minutes };
};

// Validate if appointment time is within operating hours
const validateAppointmentTime = (apptDate, openTime, closeTime) => {
    const date = new Date(apptDate);

    // ใช้ Intl ดึงเวลาตามเขตเวลาไทย
    const { hours: apptHour, minutes: apptMinute } = getThailandTimeParts(date);

    // Convert times to minutes for comparison
    const apptMinutes = apptHour * 60 + apptMinute;
    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);

    // Debug logging
    console.log('UTC Date:', apptDate);
    console.log('Thailand Time:', date.toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }));
    console.log('Appointment Hour:', apptHour);
    console.log('Appointment Minute:', apptMinute);
    console.log('Appointment Time (minutes):', apptMinutes, `(${apptHour}:${apptMinute.toString().padStart(2, '0')})`);
    console.log('Open Time (minutes):', openMinutes, `(${openTime})`);
    console.log('Close Time (minutes):', closeMinutes, `(${closeTime})`);

    // Check if appointment time is within operating hours (inclusive)
    const isValid = apptMinutes >= openMinutes && apptMinutes <= closeMinutes;
    console.log('Is Valid:', isValid);

    return isValid;
};

module.exports = {
    validateAppointmentTime
};
