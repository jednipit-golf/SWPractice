const validateDateFormat = (apptDate) => {
    if (!apptDate) return false;
    
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
    
    if (!dateRegex.test(apptDate)) {
        return false;
    }
    
    // Additional validation for actual date validity
    const [day, month, year] = apptDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
};

module.exports = {
    validateDateFormat
};