let acceptedTagNames = [];
let unacceptedTagNames = [];

// TAG-N
acceptedTagNames = ["p", "p-1", "p-300", "a", "i", "li", "li-3", "h1", "h2", "img", "img-2", "h3", "h3-4", "h6-9"];
unacceptedTagNames = ["p-", "p-0", "p--01", "p-01", "p--1", "3", "0p", "3h2", "-p", "=p"];

function isValidTagN(tag) {
  const validTagNameRegex = /^[a-zA-Z]+\d*(-[1-9]\d*)?$/;
  return validTagNameRegex.test(tag);
}

acceptedTagNames.forEach(tag => {
  if (!isValidTagN(tag)) {
    console.error(`Validation failed for accepted tag name: ${tag}`);
  }
});

unacceptedTagNames.forEach(tag => {
  if (isValidTagN(tag)) {
    console.error(`Validation passed for unaccepted tag name: ${tag}`);
  }
});

// TAG

acceptedTagNames = ["p", "a", "i", "li", "h1", "h2", "img", "h3"];
unacceptedTagNames = ["p-", "p-0", "p--01", "p-01", "p--1", "3", "0p", "3h2", "-p", "=p", "p-1", "p-300", "h6-9", "h3-4", "img-2", "li-3"];

function isValidTag(tag) {
  const validTagNameRegex = /^[a-z][a-z0-9]*$/;
  return validTagNameRegex.test(tag);
}

acceptedTagNames.forEach(tag => {
  if (!isValidTag(tag)) {
    console.error(`Validation failed for accepted tag name: ${tag}`);
  }
});

unacceptedTagNames.forEach(tag => {
  if (isValidTag(tag)) {
    console.error(`Validation passed for unaccepted tag name: ${tag}`);
  }
});
