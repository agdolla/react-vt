const sinon = require('sinon'); 
const testSpy = sinon.spy();

let appName;
let tempFlag = false;
let fakeAssert = []; 
fakeAssert.push({'type': 'action', 'loc': ['clear'], 'event': 'click'});
fakeAssert.push({'type': 'test', 'loc': ['board', 0, 0]})  



function cloneDeep(value) {
	if (!(value instanceof Object)) return value; 
	const result = new value.constructor; 
	if (value.constructor === Array) {
		value.forEach(item => {
      if (item instanceof Object && item.constructor !== Array) result.push(JSON.stringify(item)); 
      else result.push(cloneDeep(item))
    });
	} else if (typeof value === 'function') {
		return 'function'; 
	} else {
		for (let key in value) {
      if (value[key] instanceof Object && value[key].constructor !== Array) result[key] = JSON.stringify(value[key])
		  else result[key] = cloneDeep(value[key]);
		}
	}
    return result;
}

const parentTraverse = (dom) => {
  console.log('real dom', dom);
  console.log('box', document.getElementById('board').children[0].children[0]);
  // This grabs the name of the top component, will be needed for when we generate enzyme test files. 
  appName = dom.constructor.name;

  // Create a new data object to fill with our parsed DOM. 
  const data = {
    attributes: {},
  };

  // target parent state
  // add conditional for whether or not parent component is smart otherwise throw error
  data.name = dom.constructor.name;
  data.attributes.component = true;
  data.attributes.state = cloneDeep(dom.state);
  data.attributes.id = [dom._reactInternalInstance._hostContainerInfo._node.id, 0]; 
  data.children = [];

  // Setting debugId of parent node to -1. Not sure if React ever uses 0. 
  data.attributes.debugId = -1; 

  // make call to another function where it will traverse through children
  const children = dom._reactInternalInstance._renderedComponent._renderedChildren;
  Object.values(children).forEach((child, index) => {
    const address = data.attributes.id.slice(0); 
    address.push(index);
    if (child.constructor.name !== 'ReactDOMTextComponent') data.children.push(traverse(child, address));
  });
  console.log('PARSED DATA', data);
  return data;
};

const traverse = (child, address) => {

  const childData = {
    attributes: {},
    children: [],
  };
  let children;
  var props;
  childData.debugId = child._debugID; 
  // set conditional for component vs not
  if (child.constructor.name === 'ReactCompositeComponentWrapper') {
    childData.name = child._currentElement.type.name;
    childData.attributes.component = true;
    childData.attributes.state = cloneDeep(child._instance.state);
    childData.attributes.props = cloneDeep(child._instance.props);
    children = child._renderedComponent._renderedChildren;
    childData.attributes.id = childData.attributes.props.id ? [childData.attributes.props.id] : address; 
  } else {
    childData.name = child._currentElement.type;
    childData.attributes.component = false;
    childData.attributes.state = null;
    childData.attributes.id = child._currentElement.props.id ? [child._currentElement.props.id] : address; 
    // To revise later
    childData.attributes.props = null;
    children = child._renderedChildren;
  }

  // filter out text nodes from children
  if (children) {
      Object.values(children).forEach((child, index) => {

        let newAddress = childData.attributes.id.slice(0);
        newAddress.push(index);
        // Filter out all React Text Nodes
        // We may want to add the text data to the parent node on a future revision
        if (child.constructor.name !== 'ReactDOMTextComponent') childData.children.push(traverse(child, newAddress));
      });
  }
  return childData;
};

module.exports = parentTraverse;