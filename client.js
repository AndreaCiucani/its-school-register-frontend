const {default: axios} = require("axios")

const baseUrl = "65.21.243.198";
const token = "";


//login and get token
async function login(email,password){
    try {
        const response = await axios.post(`${baseUrl}/login`, {
            email: email,
            pwd: password
        });

        if(response.data.error === false && response.data.token) {
            token = response.data.token;
            console.log('Login successful!');
            return true;
        } else {
            console.error(`Login failed: ${response.data.errormessage}`);
            return false;
        }
    } catch (error) {
        console.error('Login error:', error.message);
        return false;
    }
}

const email = document.getElementById("email");
const pwd = document.getElementById("password");
const submitButton = document.getElementById("submitButton");

submitButton.addEventListener("click", async () => {
    await login(email.textContent, pwd.textContent);
})