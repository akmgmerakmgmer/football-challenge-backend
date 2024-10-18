const handler = (eventName) => {
    const payload = {
        pixel_code: '<CS99IHJC77UFDI751310>', // Replace with your actual TikTok Pixel Code
        event: eventName, // This could be "Purchase", "CompleteRegistration", etc.
        test_event_code: 'TEST08223', // Test event code from TikTok Events API
    };


    // Send the POST request to TikTok's Events API
    const response = fetch('https://business-api.tiktok.com/v1.2/pixel/track/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Token': '<46bda4d67232e02d0c42f074f8289c6e4dac5106>', // Replace with TikTok Access Token
        },
        body: JSON.stringify(payload),
    });
}
const loginHandler = () => {
    handler('Click button')

}
const signupHandler = () => {
    handler('Complete Registration')

}
module.exports = { loginHandler, signupHandler }