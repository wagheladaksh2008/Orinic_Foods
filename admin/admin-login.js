const form = document.getElementById("adminLoginForm");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const button =
        document.getElementById("loginBtn");

    const message =
        document.getElementById("loginMessage");


    button.disabled = true;

    button.textContent = "Signing in...";


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });


    if (error) {

        console.error(error);

        message.textContent = error.message;

        button.disabled = false;

        button.textContent = "Sign In →";

        return;
    }


    const user = data.user;


    const { data: admin, error: adminError } =
        await supabaseClient
            .from("admin_users")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();


    if (adminError || !admin) {

        await supabaseClient.auth.signOut();

        message.textContent =
            "This account is not authorized as an administrator.";

        button.disabled = false;

        button.textContent = "Sign In →";

        return;
    }


    window.location.href = "admin.html";

});