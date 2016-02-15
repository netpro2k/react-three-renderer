import ReactReconciler from 'react/lib/ReactReconciler';
import ReactMultiChild from 'react/lib/ReactMultiChild';

import invariant from 'fbjs/lib/invariant';

import flattenChildren from 'react/lib/flattenChildren';
import ReactCurrentOwner from 'react/lib/ReactCurrentOwner';

import ID_PROPERTY_NAME from './utils/idPropertyName';

import React3CompositeComponentWrapper from './React3CompositeComponentWrapper';

function processChildContext(context) {
  // if (process.env.NODE_ENV !== 'production') {
  //   // // Pass down our tag name to child components for validation purposes
  //   // context = assign({}, context);
  //   // const info = context[validateDOMNesting.ancestorInfoContextKey];
  //   // context[validateDOMNesting.ancestorInfoContextKey] =
  //        validateDOMNesting.updatedAncestorInfo(info, inst._tag, inst);
  // }
  return context;
}

class RemountTrigger {
  constructor() {
    this.wantRemount = false;
    this.onTrigger = function onTrigger() {
    };

    this.trigger = () => {
      this.wantRemount = true;

      this.onTrigger();
    };
  }
}

const registrationNameModules = {};

function deleteListener(rootNodeID, propKey) {
  console.log('deleteListener', rootNodeID, propKey); // eslint-disable-line
  debugger; // eslint-disable-line
}

function enqueuePutListener(rootNodeID, propKey, nextProp, transaction) {
  console.log('enqueuePutListener', rootNodeID, propKey, nextProp, transaction); // eslint-disable-line
  debugger; // eslint-disable-line
}

function _arrayMove(array, oldIndex, newIndex) {
  array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
}

const getThreeObjectFromMountImage = img => img.threeObject;

const ReactMultiChildMixin = ReactMultiChild.Mixin;

class InternalComponent {
  static displayName = 'React3Component';

  constructor(element, react3RendererInstance) {
    this._currentElement = element;
    /**
     * @type React3Renderer
     */
    this._react3RendererInstance = react3RendererInstance;

    // console.log("internal: ", element);

    this._elementType = element.type;
    this._renderedChildren = [];
    this._rootNodeID = null;
    this._threeObject = null;
    this._topLevelWrapper = null;
    this._markup = null;
    this._nodeWithLegacyProperties = null;
    this._forceRemountOfComponent = false;

    this.threeElementDescriptor = react3RendererInstance.threeElementDescriptors[element.type];
    if (!this.threeElementDescriptor) {
      if (process.env.NODE_ENV !== 'production') {
        invariant(false, `No constructor for ${element.type}`);
      } else {
        invariant(false);
      }
    }

    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_REACT_ADDON_HOOKS === 'true') {
      this.highlightComponent = () => {
        this.threeElementDescriptor.highlight(this._threeObject);
      };

      this.hideHighlight = () => {
        this.threeElementDescriptor.hideHighlight(this._threeObject);
      };
    }

    this.remountTrigger = new RemountTrigger();

    this.remountTrigger.onTrigger = () => {
      this._forceRemountOfComponent = true;
    };
  }

  construct(element) {
    // console.log('constructing', element);
    this._currentElement = element;
  }

  mountComponent(rootID, transaction, context) {
    // console.log("mount component", rootID);

    const element = this._currentElement;
    this._rootNodeID = rootID;

    if (process.env.NODE_ENV !== 'production') {
      this.threeElementDescriptor.checkPropTypes(element.type,
        this._currentElement._owner, element.props);
    }

    this._threeObject = this.threeElementDescriptor.construct(element.props);
    this.threeElementDescriptor.applyInitialProps(this._threeObject, element.props);

    this.threeElementDescriptor.placeRemountTrigger(this._threeObject, this.remountTrigger.trigger);

    const childrenToUse = element.props.children;

    const mountImages = this.mountChildren(childrenToUse, transaction,
      processChildContext(context, this));

    const markup = {
      [ID_PROPERTY_NAME]: rootID,
      _rootInstance: null,
      elementType: element.type,
      threeObject: this._threeObject,
      parentMarkup: null,
      childrenMarkup: mountImages,
      toJSON: () => '---MARKUP---',
    };

    if (process.env.NODE_ENV !== 'production') {
      invariant(!!this._threeObject.userData,
        'No userdata present in threeobject for %s', element.type);
    } else {
      invariant(!!this._threeObject.userData);
    }

    this._threeObject.userData = {
      ...this._threeObject.userData,
      object3D: this._threeObject,
      react3internalComponent: this, // used for highlighting etc
      toJSON: () => '---USERDATA---',
      markup,
    };

    const threeElementDescriptors = this._react3RendererInstance.threeElementDescriptors;

    if (mountImages && mountImages.length > 0) {
      this.threeElementDescriptor.addChildren(this._threeObject,
        mountImages.map(getThreeObjectFromMountImage));

      for (let i = 0; i < mountImages.length; ++i) {
        const mountImage = mountImages[i];

        const descriptorForChild = threeElementDescriptors[mountImage.elementType];

        mountImage.parentMarkup = markup;

        descriptorForChild.setParent(mountImage.threeObject, this._threeObject);
      }
    }

    this._markup = markup;

    return markup;
  }

  _reconcilerInstantiateChildren(nestedChildren, transaction, context) {
    if (process.env.NODE_ENV !== 'production') {
      if (this._currentElement) {
        const previousCurrent = ReactCurrentOwner.current;

        try {
          ReactCurrentOwner.current = this._currentElement._owner;
          return this._react3RendererInstance.instantiateChildren(
            nestedChildren, transaction, context
          );
        } finally {
          ReactCurrentOwner.current = previousCurrent;
        }
      }
    }
    return this._react3RendererInstance.instantiateChildren(
      nestedChildren, transaction, context
    );
  }

  _reconcilerUpdateChildren(prevChildren, nextNestedChildrenElements, transaction, context) {
    let nextChildren;
    if (process.env.NODE_ENV !== 'production') {
      if (this._currentElement) {
        const previousCurrent = ReactCurrentOwner.current;

        try {
          ReactCurrentOwner.current = this._currentElement._owner;
          nextChildren = flattenChildren(nextNestedChildrenElements);
        } finally {
          ReactCurrentOwner.current = previousCurrent;
        }

        return this._react3RendererInstance.updateChildren(
          prevChildren, nextChildren, transaction, context
        );
      }
    }

    nextChildren = flattenChildren(nextNestedChildrenElements);
    return this._react3RendererInstance.updateChildren(
      prevChildren, nextChildren, transaction, context
    );
  }

  mountChildren(nestedChildren, transaction, context) {
    const children = this._reconcilerInstantiateChildren(
      nestedChildren, transaction, context);
    this._renderedChildren = children;
    const mountImages = [];
    let index = 0;

    if (!!children) {
      const childrenNames = Object.keys(children);
      for (let i = 0; i < childrenNames.length; ++i) {
        const name = childrenNames[i];

        const child = children[name];
        // Inlined for performance, see `ReactInstanceHandles.createReactID`.
        const rootID = this._rootNodeID + name;
        const mountImage = ReactReconciler.mountComponent(child, rootID, transaction, context);
        child._mountIndex = index;
        mountImages.push(mountImage);
        index++;
      }
    }

    return mountImages;
  }

  moveChild(child, toIndex, lastIndex) {
    if (child._mountIndex === toIndex) {
      return;
    }

    this.threeElementDescriptor.moveChild(this._threeObject,
      child._threeObject, toIndex, child._mountIndex);

    const markup = this._markup;

    _arrayMove(markup.childrenMarkup, lastIndex, toIndex);
  }

  receiveComponent(nextElement, transaction, context) {
    // console.log('receive component');

    const prevElement = this._currentElement;
    this._currentElement = nextElement;

    this.updateComponent(transaction, prevElement, nextElement, context);
  }

  updateComponent(transaction, prevElement, nextElement, context) {
    const lastProps = prevElement.props;
    const nextProps = this._currentElement.props;

    if (prevElement.type !== nextElement.type) {
      if (process.env.NODE_ENV !== 'production') {
        invariant(false, 'The component type changed unexpectedly');
      } else {
        invariant(false);
      }
    }

    this._updateObjectProperties(lastProps, nextProps, transaction, context);
    this._updateChildrenObjects(nextProps, transaction, processChildContext(context, this));
  }

  _updateChildrenObjects(nextProps, transaction, context) {
    const nextChildren = nextProps.children || null;

    this.updateChildren(nextChildren, transaction, context);
  }

  _updateObjectProperties(lastProps, nextProps, transaction) {
    const remountTrigger = this.remountTrigger;

    remountTrigger.wantRemount = false;

    this.threeElementDescriptor.beginPropertyUpdates(this._threeObject);

    if (process.env.NODE_ENV !== 'production') {
      this.threeElementDescriptor.checkPropTypes(this._currentElement.type,
        this._currentElement._owner, nextProps);
    }

    const lastPropKeys = Object.keys(lastProps);

    // https://jsperf.com/object-keys-vs-for-in-with-closure/3
    for (let i = 0; i < lastPropKeys.length; ++i) {
      const propKey = lastPropKeys[i];

      if (nextProps.hasOwnProperty(propKey)) {
        continue;
      }

      if (propKey === 'children') {
        continue;
      }

      if (remountTrigger.wantRemount) {
        break;
      }

      if (registrationNameModules.hasOwnProperty(propKey)) {
        if (lastProps[propKey]) {
          // Only call deleteListener if there was a listener previously or
          // else willDeleteListener gets called when there wasn't actually a
          // listener (e.g., onClick={null})
          deleteListener(this._rootNodeID, propKey);
        }
      } else {
        this.threeElementDescriptor.deleteProperty(this._threeObject, propKey);
      }
    }

    const nextPropKeys = Object.keys(nextProps);

    for (let i = 0; i < nextPropKeys.length; ++i) {
      const propKey = nextPropKeys[i];

      if (propKey === 'children') {
        continue;
      }

      if (remountTrigger.wantRemount) {
        break;
      }

      const nextProp = nextProps[propKey];
      const lastProp = lastProps[propKey];

      if (nextProp === lastProp) {
        continue;
      }

      if (registrationNameModules.hasOwnProperty(propKey)) {
        if (nextProp) {
          enqueuePutListener(this._rootNodeID, propKey, nextProp, transaction);
        } else if (lastProp) {
          deleteListener(this._rootNodeID, propKey);
        }
      } else {
        this.threeElementDescriptor.updateProperty(this._threeObject, propKey, nextProp);
      }
    }

    this.threeElementDescriptor.completePropertyUpdates(this._threeObject);
  }

  /**
   * @see ReactDOMComponent.Mixin.unmountComponent
   * node_modules/react/lib/ReactDOMComponent.js:732
   */
  unmountComponent() {
    if (this._threeObject !== null) {
      this.threeElementDescriptor.componentWillUnmount(this._threeObject);
    }
    this.unmountChildren();
    if (this._threeObject !== null) {
      this.threeElementDescriptor.unmount(this._threeObject);
      // delete this._threeObject.userData.markup;
    }

    this._markup = null;
    this._rootNodeID = null;
    if (this._nodeWithLegacyProperties) {
      const node = this._nodeWithLegacyProperties;
      node._reactInternalComponent = null;
      this._nodeWithLegacyProperties = null;
    }
  }


  emptyJson() {
    debugger; // eslint-disable-line
    return '...';
  }

  getPublicInstance() {
    const markup = this._react3RendererInstance.getMarkup(this._rootNodeID);

    if (markup.threeObject) {
      markup.threeObject.toJSON = this.emptyJson;
      return markup.threeObject;
    }

    if (process.env.NODE_ENV !== 'production') {
      invariant(false, 'Node has no threeObject?');
    } else {
      invariant(false);
    }
  }

  /**
   * @see ReactMultiChildMixin._updateChildren
   *
   * Improve performance by isolating this hot code path from the try/catch
   * block in `updateChildren`.
   *
   * @param {?object} nextNestedChildren Nested child maps.
   * @param {ReactReconcileTransaction} transaction
   * @param {any} context
   * @final
   * @protected
   */
  _updateChildren(nextNestedChildren, transaction, context) {
    const prevChildren = this._renderedChildren;
    const nextChildren = this._reconcilerUpdateChildren(prevChildren,
      nextNestedChildren, transaction, context);

    this._renderedChildren = nextChildren;
    if (!nextChildren && !prevChildren) {
      return;
    }

    const remountTrigger = this.remountTrigger;

    remountTrigger.wantRemount = false;

    this.threeElementDescriptor.beginChildUpdates(this._threeObject);

    // `nextIndex` will increment for each child in `nextChildren`, but
    // `lastIndex` will be the last index visited in `prevChildren`.
    let lastIndex = 0;
    let nextIndex = 0;

    if (!!nextChildren) {
      const nextChildrenNames = Object.keys(nextChildren);

      for (let i = 0; i < nextChildrenNames.length; ++i) {
        const childName = nextChildrenNames[i];

        if (remountTrigger.wantRemount) {
          // This component will be remounted, (see extrude geometry)
          // No need to update children any more as they will also be remounted!
          continue;
        }

        const prevChild = prevChildren && prevChildren[childName];
        const nextChild = nextChildren[childName];

        if (prevChild === nextChild) {
          this.moveChild(prevChild, nextIndex, lastIndex);
          lastIndex = Math.max(prevChild._mountIndex, lastIndex);
          prevChild._mountIndex = nextIndex;
        } else {
          if (prevChild) {
            // Update `lastIndex` before `_mountIndex` gets unset by unmounting.
            lastIndex = Math.max(prevChild._mountIndex, lastIndex);
            this._unmountChild(prevChild);
          }

          if (remountTrigger.wantRemount) {
            // The remount can be triggered by unmountChild as well (see extrude geometry)
            continue;
          }

          // The child must be instantiated before it's mounted.
          this._mountChildByNameAtIndex(nextChild, childName, nextIndex, transaction, context);
        }

        nextIndex++;
      }
    }

    if (!!prevChildren) {
      // Remove children that are no longer present.
      const prevChildrenNames = Object.keys(prevChildren);

      for (let i = 0; i < prevChildrenNames.length; ++i) {
        const childName = prevChildrenNames[i];

        if (remountTrigger.wantRemount) {
          continue;
        }

        if (!(nextChildren && nextChildren.hasOwnProperty(childName))) {
          this._unmountChild(prevChildren[childName]);
        }
      }
    }

    this.threeElementDescriptor.completeChildUpdates(this._threeObject);
  }

  createChild(child, mountImage) {
    const mountIndex = child._mountIndex;

    this._markup.childrenMarkup.splice(mountIndex, 0, mountImage);
    mountImage.parentMarkup = this._markup;

    this.threeElementDescriptor.addChild(this._threeObject, mountImage.threeObject, mountIndex);

    const descriptorForChild = this._react3RendererInstance
      .threeElementDescriptors[mountImage.elementType];

    descriptorForChild.setParent(mountImage.threeObject, this._threeObject);
  }

  /**
   * Removes a child component.
   *
   * @param {ReactComponent} child Child to remove.
   * @protected
   */
  removeChild(child) {
    this.threeElementDescriptor.removeChild(this._threeObject, child._threeObject);

    if (child instanceof InternalComponent) {
      child.threeElementDescriptor.removedFromParent(child._threeObject);
    } else if (child instanceof React3CompositeComponentWrapper) {
      child._threeObject.userData
        .react3internalComponent
        .threeElementDescriptor.removedFromParent(child._threeObject);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        invariant(false, 'Cannot remove child because it is not a known component type');
      } else {
        invariant(false);
      }
    }

    const childrenMarkup = this._markup.childrenMarkup;

    for (let i = 0; i < childrenMarkup.length; i++) {
      const childMarkup = childrenMarkup[i];

      if (childMarkup.threeObject === child._threeObject) {
        childrenMarkup.splice(i, 1);

        delete childMarkup.parentMarkup;
        return;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      invariant(false, `Trying to remove a child that is not mounted`);
    } else {
      invariant(false);
    }
  }

  updateChildren = ReactMultiChildMixin.updateChildren.bind(this);
  _mountChildByNameAtIndex = ReactMultiChildMixin._mountChildByNameAtIndex.bind(this);
  _unmountChild = ReactMultiChildMixin._unmountChild.bind(this);
  unmountChildren = ReactMultiChildMixin.unmountChildren.bind(this);
}

module.exports = InternalComponent;
