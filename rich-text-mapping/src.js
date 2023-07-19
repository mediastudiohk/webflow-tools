// Initialization
document.addEventListener('DOMContentLoaded', () => {
  if (!isCompatibleBrowser()) {
    console.error('Your browser is not compatible with this application. Please update to the latest version or use a modern browser.');
    return;
  }

  processAllTemplateAndSourcePairs();
});

function isCompatibleBrowser() {
  return typeof Array.from === 'function' &&
         typeof document.querySelector === 'function' &&
         typeof document.querySelectorAll === 'function' &&
         'textContent' in document.createElement('div') &&
         'cloneNode' in document.createElement('div');
}

// Main Processing Functions
function processAllTemplateAndSourcePairs() {
  let templateElements = getAllTemplateElements();
  let sourceElements = getAllSourceElements();

  checkTemplateSourcePairCount(templateElements, sourceElements);
  checkNestedTemplateAndSource(templateElements, sourceElements);

  templateElements.forEach((templateElement, index) => {
    const sourceElement = sourceElements[index];
    processTemplateAndSource(templateElement, sourceElement);
  });
}

function processTemplateAndSource(templateElement, sourceElement) {
  const repeaterTag = getRepeaterTag(templateElement);
  const repeaterElementTag = repeaterTag ? repeaterTag.toLowerCase() : null;

  const mappingElements = getMappingElements(templateElement);
  const mappingElementCounts = getMappingElementCounts(mappingElements);

  const sourceChildElements = getSourceChildElements(sourceElement);
  validateSourceElements(templateElement, sourceChildElements);
  
  let currentTemplateElement = initializeCurrentTemplateElement(repeaterTag, templateElement);

  let iteratorCounts = initializeIteratorCounts(mappingElementCounts);

  sourceChildElements.forEach((sourceChildElement) => {
    if (repeaterTag && isRepeaterElement(sourceChildElement, repeaterElementTag)) {
      currentTemplateElement = cloneAndInsertTemplate(templateElement);
      iteratorCounts = initializeIteratorCounts(mappingElementCounts);
    }

    if (isMappingElement(sourceChildElement, mappingElements)) {
      const tagWithIteratorSuffix = getTagWithIteratorSuffix(sourceChildElement.tagName.toLowerCase(), iteratorCounts);
      updateTargetElement(currentTemplateElement, sourceChildElement, tagWithIteratorSuffix);
    }
  });

  removeOriginalElements(repeaterTag, templateElement, sourceElement);
}

// Functions for Getting Elements and Attributes
const getAllTemplateElements = () => Array.from(document.querySelectorAll('[ms-mapping-element^="template"]'));
const getAllSourceElements = () => Array.from(document.querySelectorAll('[ms-mapping-element^="source"]'));
const getSourceChildElements = (sourceElement) => sourceElement.querySelectorAll('*');

// Error Reporting and Validation Functions
function checkTemplateSourcePairCount(templateElements, sourceElements) {
  if (templateElements.length !== sourceElements.length) {
    console.error(`The number of template (${templateElements.length}) and source (${sourceElements.length}) elements must be equal.`);
    return;
  }
}

function checkNestedTemplateAndSource(templateElements, sourceElements) {
  templateElements.forEach((templateElement) => {
    sourceElements.forEach((sourceElement) => {
      if (templateElement.contains(sourceElement) || sourceElement.contains(templateElement)) {
        console.error(`A source element ms-mapping-element="${getMappingElementValue(sourceElement)}" is nested inside a template element ms-mapping-element="${getMappingElementValue(templateElement)} or vice versa. Please ensure that template and source elements are not nested within each other.`);
        throw new Error('Nested template and source elements are not allowed.');
      }
    });
  });
}

function isValidTagN(tag) {
  const validTagNameRegex = /^[a-zA-Z]+\d*(-[1-9]\d*)?$/;
  return validTagNameRegex.test(tag);
}

function isValidTag(tag) {
  const validTagNameRegex = /^[a-z][a-z0-9]*$/;
  return validTagNameRegex.test(tag);
}

// Check for missing source elements corresponding to mapping tags in the template
function validateSourceElements(templateElement, sourceChildElements) {
  const mappingTagsInTemplate = getMappingElements(templateElement);
  const sourceElementTags = Array.from(sourceChildElements).map(el => el.tagName.toLowerCase());

  mappingTagsInTemplate.forEach(mappingTag => {
    const [baseTag] = mappingTag.split('-');
    if (!sourceElementTags.includes(baseTag)) {
      const templateElementValue = getMappingElementValue(templateElement);
      console.warn(`Warning: a mapping tag "${mappingTag}" in the template element with ms-mapping-element="${templateElementValue}" does not have a corresponding source element.`);
    }
  });
}

// Checks if the source child element is a repeater element
const isRepeaterElement = (sourceChildElement, repeaterElementTag) =>
  sourceChildElement.tagName.toLowerCase() === repeaterElementTag;

// Checks if the source child element is a mapping element
const isMappingElement = (sourceChildElement, mappingElements) => {
  const sourceElementTag = sourceChildElement.tagName.toLowerCase();
  return mappingElements.some(mappingElement => {
    const [tag] = mappingElement.split('-');
    return tag === sourceElementTag;
  });
}

// Functions for Processing Logic
function initializeCurrentTemplateElement(repeaterTag, templateElement) {
  return repeaterTag ? null : templateElement;
}

function removeOriginalElements(repeaterTag, templateElement, sourceElement) {
  if (repeaterTag) {
    templateElement.remove();
  }
  sourceElement.remove();
}

// Functions for Working with Template Elements and Source Elements
const getMappingElementValue = (element) => element.getAttribute('ms-mapping-element') || "";
const getMappingTagValue = (element) => element.getAttribute('ms-mapping-tag') || "";

function getRepeaterTag(templateElement) {
  const repeaterTag = templateElement.getAttribute('ms-mapping-repeatertag');
  if (repeaterTag) {
    isValidTag(repeaterTag);
  }
  return repeaterTag;
}

function getMappingElementCounts(mappingElements) {
  const counts = {};
  mappingElements.forEach((mappingElement) => {
    const [tag, iterator] = mappingElement.split('-');
    counts[tag] = iterator ? Math.max(counts[tag] || 0, parseInt(iterator, 10)) : counts[tag] || 0;
  });
  return counts;
}

function initializeIteratorCounts(mappingElementCounts) {
  const iteratorCounts = {};
  for (const tag in mappingElementCounts) {
    iteratorCounts[tag] = 1;
  }
  return iteratorCounts;
}

function getTagWithIteratorSuffix(tag, iteratorCounts) {
  if (iteratorCounts[tag] === 0) {
    return tag;
  }
  const tagWithIteratorSuffix = `${tag}-${iteratorCounts[tag]}`;
  iteratorCounts[tag]++;
  return tagWithIteratorSuffix;
}

// Gets the mapping elements within the template element
function getMappingElements(templateElement) {
  const elements = Array.from(templateElement.querySelectorAll('[ms-mapping-tag]'));
  elements.forEach((el) => {
    const tag = el.getAttribute('ms-mapping-tag');
    if (!isValidTagN(tag)) {
      console.error(`Invalid ms-mapping-tag attribute: "${tag}". It must be either a valid HTML tag name, or a valid HTML tag name followed by a dash and a positive integer. Examples of valid attributes include "p", "p-1", "div-2", etc.`);
      throw new Error('Invalid ms-mapping-tag');
    }
  });
  return elements.map(el => el.getAttribute('ms-mapping-tag'));
}

// Clones the template element and inserts it before the original template element
const cloneAndInsertTemplate = (templateElement) => {
  const clonedTemplate = templateElement.cloneNode(true);
  templateElement.insertAdjacentElement('beforebegin', clonedTemplate);
  return clonedTemplate;
}

// 7. Update Functions
function updateTargetElement(currentTemplateElement, sourceChildElement, tagWithIteratorSuffix) {
  if (!currentTemplateElement) {
    return;
  }

  const sourceElementTag = sourceChildElement.tagName.toLowerCase();
  let targetElements = currentTemplateElement.querySelectorAll(`[ms-mapping-tag="${tagWithIteratorSuffix}"]`);

  if (!targetElements.length) {
    targetElements = currentTemplateElement.querySelectorAll(`[ms-mapping-tag="${sourceElementTag}"]`);
  }

  // If targetElements are not found, ignore the sourceChildElement and return.
  if (!targetElements.length) {
    const templateElementValue = getMappingElementValue(currentTemplateElement);
    const sourceElementValue = getMappingElementValue(sourceChildElement.parentNode);
    console.warn(`Warning: The source element with tag ${sourceChildElement.tagName} in the source element with ms-mapping-element="${sourceElementValue}" does not have a corresponding target element in the template element with ms-mapping-element="${templateElementValue}".`);
    return;
  }

  targetElements.forEach(targetElement => updateElement(targetElement, sourceChildElement));
}

// Updates the target element based on the source element
function updateElement(targetElement, sourceElement) {
  targetElement.innerHTML = sourceElement.innerHTML;

  Array.from(sourceElement.attributes).forEach(attribute => {
    if (!attribute.name.startsWith('ms-')) {
      targetElement.setAttribute(attribute.name, attribute.value);
    }
  });

  // Remove the mapping attributes from the target element
  targetElement.removeAttribute('ms-mapping-element');
  targetElement.removeAttribute('ms-mapping-tag');
}
