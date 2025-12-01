// React DOM shim for React Native
// This file provides empty implementations of react-dom exports
// to satisfy web-focused dependencies like @clerk/clerk-react

'use strict';

// Provide minimal exports that won't cause crashes
const reactDomShim = {
  // Core APIs
  render: function() {},
  hydrate: function() {},
  unmountComponentAtNode: function() {},
  createPortal: function(children) { return children; },
  findDOMNode: function() { return null; },
  flushSync: function(fn) { return fn ? fn() : undefined; },

  // React 18 APIs
  createRoot: function() {
    return {
      render: function() {},
      unmount: function() {},
    };
  },
  hydrateRoot: function() {
    return {
      render: function() {},
      unmount: function() {},
    };
  },

  // Version info
  version: '18.0.0',

  // Unstable APIs that some packages might use
  unstable_batchedUpdates: function(callback) {
    return callback();
  },
  unstable_renderSubtreeIntoContainer: function() {},
};

// Ensure .default is set for ESM compatibility
reactDomShim.default = reactDomShim;

module.exports = reactDomShim;
