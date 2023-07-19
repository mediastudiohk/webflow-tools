const acceptedTagNames = ["p", "p-1", "p-300", "a", "i", "li", "li-3", "h1", "h2", "img", "img-2", "h3", "h3-4", "h6-9"];
const unacceptedTagNames = ["p-", "p-0", "p--01", "p-01", "p--1", "3", "0p", "3h2", "-p", "=p"];

function isValidTagName(tag) {
  const validTagNameRegex = /^[a-zA-Z]+\d*(-[1-9]\d*)?$/;
  return validTagNameRegex.test(tag);
}

acceptedTagNames.forEach(tag => {
  if (!isValidTagName(tag)) {
    console.error(`Validation failed for accepted tag name: ${tag}`);
  }
});

unacceptedTagNames.forEach(tag => {
  if (isValidTagName(tag)) {
    console.error(`Validation passed for unaccepted tag name: ${tag}`);
  }
});
