// Event listener to start processing when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  processAllTemplateAndSourcePairs();
});

// Main processing functions
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
  const noRepeat = checkNoRepeat(templateElement);
  const repeaterElement = getRepeaterElement(templateElement, noRepeat);

  const mappingElements = getMappingElements(templateElement);
  const mappingElementCounts = getMappingElementCounts(mappingElements);
  const repeaterElementTag = getRepeaterElementTag(repeaterElement);

  const sourceChildElements = getSourceChildElements(sourceElement);
  let currentTemplateElement = initializeCurrentTemplateElement(noRepeat, templateElement);

  let iteratorCounts = initializeIteratorCounts(mappingElementCounts);
  
  sourceChildElements.forEach((sourceChildElement) => {
    if (!noRepeat && isRepeaterElement(sourceChildElement, repeaterElementTag)) {
      currentTemplateElement = cloneAndInsertTemplate(templateElement);
      iteratorCounts = initializeIteratorCounts(mappingElementCounts);
    }

    if (isMappingElement(sourceChildElement, mappingElements)) {
      const tagWithIteratorSuffix = getTagWithIteratorSuffix(sourceChildElement.tagName.toLowerCase(), iteratorCounts);
      updateTargetElement(currentTemplateElement, sourceChildElement, tagWithIteratorSuffix);
    }
  });

  removeOriginalElements(noRepeat, templateElement, sourceElement);
}

// Functions for getting elements and attributes
const getAllTemplateElements = () => Array.from(document.querySelectorAll('[ms-mapping-element^="template"]'));
const getAllSourceElements = () => Array.from(document.querySelectorAll('[ms-mapping-element^="source"]'));
const getSourceChildElements = (sourceElement) => sourceElement.querySelectorAll('*');

const checkNoRepeat = (templateElement) => templateElement.hasAttribute('ms-mapping-norepeat');
const getRepeaterElementTag = (repeaterElement) => repeaterElement ? repeaterElement.getAttribute('ms-mapping-tag') : null;

// Functions for checking and reporting errors
const getMappingElementValue = (element) => element.getAttribute('ms-mapping-element') || "";
const getMappingTagValue = (element) => element.getAttribute('ms-mapping-tag') || "";

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

// Functions for handling the main processing logic
function initializeCurrentTemplateElement(noRepeat, templateElement) {
  return noRepeat ? templateElement : null;
}

function removeOriginalElements(noRepeat, templateElement, sourceElement) {
  if (!noRepeat) {
    templateElement.remove();
  }
  sourceElement.remove();
}

// Functions for working with template elements and source elements
function getRepeaterElement(templateElement, noRepeat) {
  if (noRepeat) {
    return null;
  }
  const repeaterElements = templateElement.querySelectorAll('[ms-mapping-element="repeater"]');
  if (repeaterElements.length !== 1) {
    console.error(`There should be only one repeater element ms-mapping-element="${getMappingElementValue(templateElement)}". Found ${repeaterElements.length} repeater elements.`);
    return null;
  }

  const repeaterElement = repeaterElements[0];
  const repeaterTag = repeaterElement.getAttribute('ms-mapping-tag');
  
  if (repeaterTag.includes('-')) {
    console.error(`The element ms-mapping-element="${getMappingElementValue(repeaterElement)}" has ms-mapping-tag="${repeaterTag}". Please remove the dash and any characters following it in the ms-mapping-tag attribute.`);
    return null;
  }

  return repeaterElement;
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
const getMappingElements = (templateElement) => Array.from(templateElement.querySelectorAll('[ms-mapping-tag]'))
  .map(el => el.getAttribute('ms-mapping-tag'));

// Clones the template element and inserts it before the original template element
const cloneAndInsertTemplate = (templateElement) => {
  const clonedTemplate = templateElement.cloneNode(true);
  templateElement.insertAdjacentElement('beforebegin', clonedTemplate);
  return clonedTemplate;
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

// Updates the target element in the current template element based on the source child element
function updateTargetElement(currentTemplateElement, sourceChildElement, tagWithIteratorSuffix) {
  if (!currentTemplateElement) {
    return;
  }

  const sourceElementTag = sourceChildElement.tagName.toLowerCase();
  let targetElement = currentTemplateElement.querySelector(`[ms-mapping-tag="${tagWithIteratorSuffix}"]`);

  if (!targetElement) {
    targetElement = currentTemplateElement.querySelector(`[ms-mapping-tag="${sourceElementTag}"]`);
  }

  // If targetElement is not found, ignore the sourceChildElement and return.
  if (!targetElement) {
    console.warn(`The source element with tag ${sourceChildElement.tagName} doesn't have a corresponding target element in the template.`);
    return;
  }

  updateElement(targetElement, sourceChildElement);
}

// Updates the target element based on the source element
function updateElement(targetElement, sourceElement) {
  targetElement.textContent = sourceElement.textContent;

  Array.from(sourceElement.attributes).forEach(attribute => {
    if (!attribute.name.startsWith('ms-')) {
      targetElement.setAttribute(attribute.name, attribute.value);
    }
  });

  // Remove the mapping attributes from the target element
  targetElement.removeAttribute('ms-mapping-element');
  targetElement.removeAttribute('ms-mapping-tag');
}
