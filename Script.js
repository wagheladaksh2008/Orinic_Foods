async function openProfile() {

  const { data: { user } } =
    await supabaseClient.auth.getUser();

  if (user) {
    window.location.href = "Profile.html";
  } else {
    window.location.href = "Login.html";
  }

}