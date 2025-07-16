   // Enable resend button after 30 seconds
    window.addEventListener("DOMContentLoaded", () => {
      const resendBtn = document.getElementById("resendBtn");
      if (resendBtn) {
        resendBtn.disabled = true;
        let counter = 30;
        resendBtn.innerText = `Resend OTP (${counter})`;
        const interval = setInterval(() => {
          counter--;
          resendBtn.innerText = `Resend OTP (${counter})`;
          if (counter <= 0) {
            clearInterval(interval);
            resendBtn.disabled = false;
            resendBtn.innerText = "Resend OTP";
          }
        }, 1000);
      }
    });