sap.ui.define([
  "sap/ui/thirdparty/sinon",
  "purchaseorders/controller/List.controller"
], function (sinon, ListController) {
  "use strict";

  // ---------------------------------------------------------------------------
  // Formatter tests – pure functions, no mocks needed
  // ---------------------------------------------------------------------------
  QUnit.module("List Controller – formatStatusText", {
    beforeEach: function () {
      this.oController = new ListController();
    }
  });

  QUnit.test("'01' returns 'Version in Arbeit'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("01"), "Version in Arbeit");
  });

  QUnit.test("'04' returns 'Freigabe teilweise'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("04"), "Freigabe teilweise");
  });

  QUnit.test("'08' returns 'Abgelehnt'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("08"), "Abgelehnt");
  });

  QUnit.test("Unknown code is returned as-is", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("99"), "99");
  });

  QUnit.test("Falsy value returns '–'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText(undefined), "–");
    assert.strictEqual(this.oController.formatStatusText(""), "–");
  });

  // ---------------------------------------------------------------------------
  QUnit.module("List Controller – formatStatusState", {
    beforeEach: function () {
      this.oController = new ListController();
    }
  });

  QUnit.test("'02' returns 'Success'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("02"), "Success");
  });

  QUnit.test("'03' returns 'Warning'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("03"), "Warning");
  });

  QUnit.test("'08' returns 'Error'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("08"), "Error");
  });

  QUnit.test("'11' returns 'Information'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("11"), "Information");
  });

  QUnit.test("Unknown code returns 'None'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("99"), "None");
  });

  // ---------------------------------------------------------------------------
  QUnit.module("List Controller – formatAmount", {
    beforeEach: function () {
      this.oController = new ListController();
    }
  });

  QUnit.test("Null amount returns '–'", function (assert) {
    assert.strictEqual(this.oController.formatAmount(null, "EUR"), "–");
  });

  QUnit.test("Zero returns '–' (falsy)", function (assert) {
    assert.strictEqual(this.oController.formatAmount(0, "EUR"), "–");
  });

  QUnit.test("Valid amount is formatted in de-DE with currency", function (assert) {
    var sResult = this.oController.formatAmount("5000.75", "USD");
    assert.ok(sResult.indexOf("5.000") !== -1, "Thousands separator present");
    assert.ok(sResult.indexOf("USD") !== -1, "Currency code present");
  });

  QUnit.test("Non-numeric string is returned as-is", function (assert) {
    assert.strictEqual(this.oController.formatAmount("abc", "EUR"), "abc");
  });

  // ---------------------------------------------------------------------------
  // onToggleFilter
  //
  // UI5's Controller.byId reads this.oView directly (not this.getView()).
  // sinon.stub on prototype methods fails because they may be non-configurable.
  // Official SAP pattern: set this.oController.oView to a plain mock object.
  // ---------------------------------------------------------------------------
  QUnit.module("List Controller – onToggleFilter", {
    beforeEach: function () {
      this.oController = new ListController();
      this.oController._filterVisible = true;

      this.setVisibleSpy = sinon.spy();
      this.setTextSpy    = sinon.spy();

      var self = this;
      // Assign a mock view directly to oView – the property byId reads internally
      this.oController.oView = {
        byId: function (sId) {
          if (sId === "filterPanel")     { return { setVisible: self.setVisibleSpy }; }
          if (sId === "btnToggleFilter") { return { setText:    self.setTextSpy    }; }
          return null;
        }
      };
    },
    afterEach: function () {
      this.oController.oView = null;
    }
  });

  QUnit.test("Hides panel when it was visible, updates button text", function (assert) {
    this.oController._filterVisible = true;
    this.oController.onToggleFilter();

    assert.ok(this.setVisibleSpy.calledWith(false), "Panel hidden");
    assert.ok(this.setTextSpy.calledWith("Filter einblenden"), "Button shows 'Filter einblenden'");
    assert.strictEqual(this.oController._filterVisible, false, "Flag toggled to false");
  });

  QUnit.test("Shows panel when it was hidden, updates button text", function (assert) {
    this.oController._filterVisible = false;
    this.oController.onToggleFilter();

    assert.ok(this.setVisibleSpy.calledWith(true), "Panel shown");
    assert.ok(this.setTextSpy.calledWith("Filter ausblenden"), "Button shows 'Filter ausblenden'");
    assert.strictEqual(this.oController._filterVisible, true, "Flag toggled to true");
  });

  QUnit.test("Toggle twice returns to original state", function (assert) {
    this.oController._filterVisible = true;
    this.oController.onToggleFilter();
    this.oController.onToggleFilter();

    assert.strictEqual(this.oController._filterVisible, true, "Flag back to true after two toggles");
    assert.strictEqual(this.setVisibleSpy.callCount, 2, "setVisible called twice");
  });

  // ---------------------------------------------------------------------------
  // _applyFilters – same oView pattern
  // ---------------------------------------------------------------------------
  QUnit.module("List Controller – _applyFilters", {
    beforeEach: function () {
      this.oController = new ListController();
      this.filterSpy   = sinon.spy();

      var self = this;
      this.oController.oView = {
        byId: function (sId) {
          if (sId === "searchField")    { return { getValue:       function () { return ""; } }; }
          if (sId === "filterStatus")   { return { getSelectedKey: function () { return ""; } }; }
          if (sId === "filterPurchOrg") { return { getSelectedKey: function () { return ""; } }; }
          if (sId === "filterCompany")  { return { getSelectedKey: function () { return ""; } }; }
          if (sId === "ordersTable")    {
            return {
              getBinding: function (sAgg) {
                return sAgg === "items" ? { filter: self.filterSpy } : null;
              }
            };
          }
          return null;
        }
      };
    },
    afterEach: function () {
      this.oController.oView = null;
    }
  });

  QUnit.test("No criteria: filter called with empty array", function (assert) {
    this.oController._applyFilters();

    assert.ok(this.filterSpy.calledOnce, "filter() called on binding");
    var arg = this.filterSpy.firstCall.args[0];
    assert.ok(Array.isArray(arg) && arg.length === 0, "Empty filter array passed");
  });

  QUnit.test("Status '03' selected: a composite Filter object is passed", function (assert) {
    var self = this;
    this.oController.oView.byId = function (sId) {
      if (sId === "searchField")    { return { getValue:       function () { return ""; } }; }
      if (sId === "filterStatus")   { return { getSelectedKey: function () { return "03"; } }; }
      if (sId === "filterPurchOrg") { return { getSelectedKey: function () { return ""; } }; }
      if (sId === "filterCompany")  { return { getSelectedKey: function () { return ""; } }; }
      if (sId === "ordersTable")    {
        return { getBinding: function (sAgg) {
          return sAgg === "items" ? { filter: self.filterSpy } : null;
        }};
      }
      return null;
    };

    this.oController._applyFilters();

    assert.ok(this.filterSpy.calledOnce, "filter() called");
    assert.ok(!Array.isArray(this.filterSpy.firstCall.args[0]), "Composite Filter object passed");
  });

  QUnit.test("Search term '4500001': a composite Filter object is passed", function (assert) {
    var self = this;
    this.oController.oView.byId = function (sId) {
      if (sId === "searchField")    { return { getValue:       function () { return "4500001"; } }; }
      if (sId === "filterStatus")   { return { getSelectedKey: function () { return ""; } }; }
      if (sId === "filterPurchOrg") { return { getSelectedKey: function () { return ""; } }; }
      if (sId === "filterCompany")  { return { getSelectedKey: function () { return ""; } }; }
      if (sId === "ordersTable")    {
        return { getBinding: function (sAgg) {
          return sAgg === "items" ? { filter: self.filterSpy } : null;
        }};
      }
      return null;
    };

    this.oController._applyFilters();

    assert.ok(this.filterSpy.calledOnce, "filter() called");
    assert.ok(!Array.isArray(this.filterSpy.firstCall.args[0]), "Filter object passed for search term");
  });

  // ---------------------------------------------------------------------------
  // onTableUpdateFinished – same oView pattern
  // ---------------------------------------------------------------------------
  QUnit.module("List Controller – onTableUpdateFinished", {
    beforeEach: function () {
      this.oController = new ListController();
      this.setTextSpy  = sinon.spy();

      var self = this;
      this.oController.oView = {
        byId: function (sId) {
          if (sId === "txtFilterCount") { return { setText: self.setTextSpy }; }
          return null;
        }
      };
    },
    afterEach: function () {
      this.oController.oView = null;
    }
  });

  QUnit.test("Sets text with 'X von Y Bestellungen'", function (assert) {
    var oEvent = {
      getParameter: function (sName) { return sName === "total" ? 100 : 20; }
    };

    this.oController.onTableUpdateFinished(oEvent);

    assert.ok(this.setTextSpy.calledOnce, "setText called");
    assert.strictEqual(
      this.setTextSpy.firstCall.args[0],
      "20 von 100 Bestellungen",
      "Correct count text"
    );
  });
});
