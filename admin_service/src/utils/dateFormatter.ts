export const formatToKST = (dateString?: string): string => {
    if (!dateString) return '';
    try {
        // Assume UTC if no 'Z', add it for correct parsing
        const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcDateString);
        if (isNaN(date.getTime())) {
            return dateString.replace('T', ' ').substring(0, 19);
        }

        // Add 9 hours for KST
        date.setHours(date.getHours() + 9);

        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
        return dateString.replace('T', ' ').substring(0, 19);
    }
};