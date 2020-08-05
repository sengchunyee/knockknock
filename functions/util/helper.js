const isEmpty = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0)
  );
};

const isEmail = (email) => {
  let emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.match(emailRegEx)) return true;
  else return false;
};

//validate user signup
const validateSignUp = (data) => {
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Email format not valid";
  }

  if (isEmpty(data.password)) {
    errors.password = "Password must not be empty";
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Password not same";
  }
  if (isEmpty(data.handle)) {
    errors.handle = "Handle must not be empty";
  }

  return {
    valid: Object.keys(errors).length === 0 ? true : false,
    errors,
  };
};

//validate user login
const validateLogin = (data) => {
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = "Email must not be empty";
  }
  if (isEmpty(data.password)) {
    errors.email = "Password must not be empty";
  }
  return {
    valid: Object.keys(errors).length === 0 ? true : false,
    errors,
  };
};

const randomNameGenerate = () => {
  const result =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  return result;
};

module.exports = { validateSignUp, validateLogin, randomNameGenerate };
