// =============================================
// ORINIC FOODS - SHARED LOGIN SYSTEM
// ADMIN + CUSTOMER
// =============================================

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginButton = document.querySelector(".login-btn");

    // Check required HTML elements
    if (!loginForm || !passwordInput || !loginButton) {
        console.error("Login page elements are missing.");
        return;
    }

    // =========================================
    // SHOW / HIDE PASSWORD
    // =========================================

    if (togglePassword) {

        togglePassword.addEventListener("click", () => {

            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";

            togglePassword.textContent = isPassword ? "🙈" : "👁";

            togglePassword.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );

        });

    }

    // =========================================
    // LOGIN
    // =========================================

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        const buttonText = loginButton.querySelector("span:first-child");

        loginButton.disabled = true;

        if (buttonText) {
            buttonText.textContent = "Signing in...";
        }

        try {

            // STEP 1: SUPABASE AUTHENTICATION

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {
                throw error;
            }

            const user = data.user;

            if (!user) {
                throw new Error("Unable to verify your account.");
            }

            // STEP 2: CHECK ADMIN PERMISSION

            const { data: admin, error: adminError } =
                await supabaseClient
                    .from("admin_users")
                    .select("id, full_name")
                    .eq("id", user.id)
                    .maybeSingle();

            if (adminError) {

                console.error("Admin verification failed:", adminError);

                throw new Error(
                    "Unable to verify account permissions. Please try again."
                );

            }

            // STEP 3: REDIRECT BASED ON ROLE

            if (admin) {

                window.location.replace("admin/admin.html");

            } else {

                window.location.replace("Profile.html");

            }

        } catch (error) {

            console.error("Login error:", error);

            alert(error.message || "Login failed. Please try again.");

            loginButton.disabled = false;

            if (buttonText) {
                buttonText.textContent = "Log In";
            }

        }

    });

});