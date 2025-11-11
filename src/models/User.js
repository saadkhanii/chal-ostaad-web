export class User {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }

  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  validatePassword() {
    return this.password && this.password.length >= 6;
  }

  isValid() {
    return this.validateEmail() && this.validatePassword();
  }
}