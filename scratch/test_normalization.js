const { normalizeEmail } = require('validator');

const emails = [
    'acarolinasilva.a@gmail.com',
    'test.email+tag@gmail.com',
    'Normal.Email@example.com'
];

console.log('--- Testing normalizeEmail with dots and subaddress preserved ---');
emails.forEach(email => {
    const normalized = normalizeEmail(email, {
        gmail_remove_dots: false,
        gmail_remove_subaddress: false
    });
    console.log(`${email} -> ${normalized}`);
});

console.log('\n--- Testing default normalizeEmail (current behavior) ---');
emails.forEach(email => {
    const normalized = normalizeEmail(email);
    console.log(`${email} -> ${normalized}`);
});
