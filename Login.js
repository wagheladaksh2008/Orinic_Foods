// =========================================
// PASSWORD SHOW / HIDE
// =========================================

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";
        togglePassword.textContent = "🙈";

    } else {

        passwordInput.type = "password";
        togglePassword.textContent = "👁";

    }

});


// =========================================
// LOGIN FORM
// =========================================

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    // Check empty fields

    if (!email || !password) {

        alert("Please enter your email and password.");

        return;

    }


    // Disable button while logging in

    const loginButton =
        document.querySelector(".login-btn");

    loginButton.disabled = true;

    loginButton.querySelector("span:first-child").textContent =
        "Signing in...";


    // =========================================
    // SUPABASE LOGIN
    // =========================================

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,
            password: password

        });


    // =========================================
    // LOGIN ERROR
    // =========================================

    if (error) {

        console.error("Login error:", error);

        alert(error.message);

        loginButton.disabled = false;

        loginButton.querySelector("span:first-child").textContent =
            "Log In";

        return;

    }


    // =========================================
    // LOGIN SUCCESS
    // =========================================

    console.log("Login successful:", data.user);

    window.location.href = "profile.html";

});