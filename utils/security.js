const Security = {
    encrypt(data, password = '') {
        if (!password) return btoa(JSON.stringify(data));
        
        let encrypted = '';
        for (let i = 0; i < JSON.stringify(data).length; i++) {
            encrypted += String.fromCharCode(
                JSON.stringify(data).charCodeAt(i) ^ password.charCodeAt(i % password.length)
            );
        }
        return btoa(encrypted);
    },
    
    decrypt(encryptedData, password = '') {
        try {
            if (!password) {
                return JSON.parse(atob(encryptedData));
            }
            
            const decoded = atob(encryptedData);
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                decrypted += String.fromCharCode(
                    decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length)
                );
            }
            return JSON.parse(decrypted);
        } catch (error) {
            throw new Error('Failed to decrypt data. Check your password.');
        }
    }
};