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
// CONFIRM PASSWORD SHOW / HIDE
// =========================================

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");

toggleConfirmPassword.addEventListener("click", function () {

    if (confirmPasswordInput.type === "password") {
        confirmPasswordInput.type = "text";
        toggleConfirmPassword.textContent = "🙈";
    } else {
        confirmPasswordInput.type = "password";
        toggleConfirmPassword.textContent = "👁";
    }

});


// =========================================
// SIGNUP FORM
// =========================================

const signupForm =
    document.getElementById("signupForm");


signupForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    // =========================================
    // GET FORM VALUES
    // =========================================

    const fullName =
        document.getElementById("fullName").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;


    // =========================================
    // VALIDATION
    // =========================================

    if (!fullName || !email || !phone || !password || !confirmPassword) {

        alert("Please fill in all fields.");

        return;
    }


    if (password !== confirmPassword) {

        alert("Passwords do not match.");

        return;
    }


    if (password.length < 6) {

        alert("Password must be at least 6 characters.");

        return;
    }


    // =========================================
    // DISABLE BUTTON
    // =========================================

    const signupButton =
        document.querySelector(".signup-btn");

    signupButton.disabled = true;

    signupButton.querySelector("span:first-child").textContent =
        "Creating account...";


    // =========================================
    // CREATE AUTH USER
    // =========================================

    const { data, error } =
        await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {

                data: {
                    full_name: fullName,
                    phone: phone
                }

            }

        });


    // =========================================
    // AUTH ERROR
    // =========================================

    if (error) {

        console.error("Signup error:", error);

        alert(error.message);

        signupButton.disabled = false;

        signupButton.querySelector("span:first-child").textContent =
            "Create Account";

        return;
    }


    // =========================================
    // CHECK USER
    // =========================================

    const user = data.user;

    if (!user) {

        alert("Account could not be created.");

        signupButton.disabled = false;

        signupButton.querySelector("span:first-child").textContent =
            "Create Account";

        return;
    }


    // =========================================
    // SUCCESS
    // =========================================

    console.log("Signup successful:", user);

    alert("Account created successfully! 🎉");

    window.location.href = "Login.html";

});