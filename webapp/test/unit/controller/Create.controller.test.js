sap.ui.define([
  "sap/ui/thirdparty/sinon",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "purchaseorders/controller/Create.controller"
], function (sinon, JSONModel, MessageBox, CreateController) {
  "use strict";

  // Helper: create a minimal view stub that holds named models
  function buildViewStub() {
    var mModels = {};
    return {
      getId: function () { return "testView"; },
      setModel: function (oModel, sName) { mModels[sName] = oModel; },
      getModel: function (sName) { return mModels[sName] || null; },
      addDependent: function () {},
      _models: mModels
    };
  }

  // Helper: create a minimal OData model stub (metadataLoaded returns a promise that never resolves,
  // so _loadSuppliers / _loadUnits are never called – keeping tests free of network calls)
  function buildODataStub() {
    return {
      metadataLoaded: function () {
        return { then: function () {} }; // intentionally never resolves
      }
    };
  }

  // ---------------------------------------------------------------------------
  // init – verifies that the three models are set on the view
  // ---------------------------------------------------------------------------
  QUnit.module("Create Controller – init", {
    beforeEach: function () {
      this.oController = new CreateController();
      this.oViewStub   = buildViewStub();
      this.oODataStub  = buildODataStub();

      this.oController.init(this.oViewStub, this.oODataStub);
    }
  });

  QUnit.test("Sets 'create' model on the view", function (assert) {
    assert.ok(this.oViewStub.getModel("create") instanceof JSONModel, "'create' model is a JSONModel");
  });

  QUnit.test("'create' model has empty gesamtbetrag and one default position", function (assert) {
    var oData = this.oViewStub.getModel("create").getData();
    assert.strictEqual(oData.gesamtbetrag, "0,00 €", "Initial total is zero");
    assert.strictEqual(oData.positions.length, 1, "One default position row");
  });

  QUnit.test("Sets 'suppliers' model on the view", function (assert) {
    assert.ok(this.oViewStub.getModel("suppliers") instanceof JSONModel, "'suppliers' model exists");
  });

  QUnit.test("Sets 'units' model on the view", function (assert) {
    assert.ok(this.oViewStub.getModel("units") instanceof JSONModel, "'units' model exists");
  });

  QUnit.test("'units' model contains default fallback entries", function (assert) {
    var aData = this.oViewStub.getModel("units").getData();
    assert.ok(aData.length > 1, "More than one unit entry available");
    var aKeys = aData.map(function (o) { return o.key; });
    assert.ok(aKeys.indexOf("Stk") !== -1, "Contains 'Stk' unit");
    assert.ok(aKeys.indexOf("kg")  !== -1, "Contains 'kg' unit");
  });

  // ---------------------------------------------------------------------------
  // onAddPosition – adds a row to /positions
  // ---------------------------------------------------------------------------
  QUnit.module("Create Controller – onAddPosition", {
    beforeEach: function () {
      this.oController = new CreateController();
      this.oViewStub   = buildViewStub();
      this.oController.init(this.oViewStub, buildODataStub());
    }
  });

  QUnit.test("Adds one row to positions array", function (assert) {
    var oModel  = this.oViewStub.getModel("create");
    var iBefore = oModel.getProperty("/positions").length;

    this.oController.onAddPosition();

    var iAfter = oModel.getProperty("/positions").length;
    assert.strictEqual(iAfter, iBefore + 1, "One row added");
  });

  QUnit.test("New row has zero qty and price", function (assert) {
    this.oController.onAddPosition();
    var aPos    = this.oViewStub.getModel("create").getProperty("/positions");
    var oNewRow = aPos[aPos.length - 1];
    assert.strictEqual(oNewRow.qty,   0, "qty is 0");
    assert.strictEqual(oNewRow.price, 0, "price is 0");
    assert.strictEqual(oNewRow.mat,   "", "mat is empty");
  });

  // ---------------------------------------------------------------------------
  // onPositionChange – recalculates gesamtbetrag from qty × price
  // ---------------------------------------------------------------------------
  QUnit.module("Create Controller – onPositionChange total calculation", {
    beforeEach: function () {
      this.oController = new CreateController();
      this.oViewStub   = buildViewStub();
      this.oController.init(this.oViewStub, buildODataStub());
    }
  });

  QUnit.test("Total is 0 when all positions have qty=0 and price=0", function (assert) {
    // Default state after init
    this.oController.onPositionChange(); // no event argument – just recalculates
    var sTotal = this.oViewStub.getModel("create").getProperty("/gesamtbetrag");
    assert.strictEqual(sTotal, "0,00 €", "Total is 0,00 €");
  });

  QUnit.test("Total equals qty × price for a single position", function (assert) {
    var oModel = this.oViewStub.getModel("create");
    oModel.setProperty("/positions", [{ mat: "", name: "", qty: 3, unit: "", price: 100 }]);

    this.oController.onPositionChange(); // recalculate without event

    var sTotal = oModel.getProperty("/gesamtbetrag");
    // 3 × 100 = 300,00 €
    assert.ok(sTotal.indexOf("300") !== -1, "Total contains 300");
    assert.ok(sTotal.indexOf("€")   !== -1, "Total contains € symbol");
  });

  QUnit.test("Total sums multiple positions correctly", function (assert) {
    var oModel = this.oViewStub.getModel("create");
    oModel.setProperty("/positions", [
      { mat: "", name: "", qty: 2, unit: "", price: 50  },  // 100
      { mat: "", name: "", qty: 4, unit: "", price: 25  }   // 100
    ]);

    this.oController.onPositionChange();

    var sTotal = oModel.getProperty("/gesamtbetrag");
    assert.ok(sTotal.indexOf("200") !== -1, "Total is 200 (sum of both rows)");
  });

  // ---------------------------------------------------------------------------
  // onSaveCreate – validation: missing required fields
  // ---------------------------------------------------------------------------
  QUnit.module("Create Controller – onSaveCreate validation", {
    beforeEach: function () {
      this.oController = new CreateController();
      this.oViewStub   = buildViewStub();
      this.oController.init(this.oViewStub, buildODataStub());

      this.errorStub = sinon.stub(MessageBox, "error");
    },
    afterEach: function () {
      this.errorStub.restore();
    }
  });

  QUnit.test("Shows error when required fields are empty", function (assert) {
    // All fields are empty after init (default empty strings)
    this.oController.onSaveCreate();

    assert.ok(this.errorStub.calledOnce, "MessageBox.error shown for missing fields");
    assert.ok(
      this.errorStub.firstCall.args[0].indexOf("Pflichtfelder") !== -1,
      "Error message mentions 'Pflichtfelder'"
    );
  });

  QUnit.test("Shows error when lieferdatum is before bestelldatum", function (assert) {
    var oModel = this.oViewStub.getModel("create");
    oModel.setData({
      lieferant:     "SUPPLIER_01",
      kategorie:     "Rohstoffe",
      bestelldatum:  "20.06.2024",
      lieferdatum:   "10.06.2024",  // before bestelldatum
      einkaeufer:    "Schmidt",
      lieferadresse: "Musterstraße 1",
      bemerkungen:   "",
      gesamtbetrag:  "0,00 €",
      positions:     []
    });

    this.oController.onSaveCreate();

    assert.ok(this.errorStub.calledOnce, "MessageBox.error shown for invalid dates");
    assert.ok(
      this.errorStub.firstCall.args[0].indexOf("Lieferdatum") !== -1,
      "Error message mentions 'Lieferdatum'"
    );
  });

  QUnit.test("Calls MessageBox.success when all fields are valid", function (assert) {
    var successStub = sinon.stub(MessageBox, "success");

    // _oDialog must exist (otherwise close() would crash)
    this.oController._oDialog = { close: function () {} };

    var oModel = this.oViewStub.getModel("create");
    oModel.setData({
      lieferant:     "SUPPLIER_01",
      kategorie:     "Rohstoffe",
      bestelldatum:  "01.06.2024",
      lieferdatum:   "20.06.2024",
      einkaeufer:    "Schmidt",
      lieferadresse: "Musterstraße 1",
      bemerkungen:   "",
      gesamtbetrag:  "0,00 €",
      positions:     []
    });

    this.oController.onSaveCreate();

    assert.ok(this.errorStub.notCalled, "No error shown");
    assert.ok(successStub.calledOnce,   "Success dialog shown");
    assert.ok(
      successStub.firstCall.args[0].indexOf("Bestellnummer") !== -1,
      "Success message contains 'Bestellnummer'"
    );

    successStub.restore();
  });

  // ---------------------------------------------------------------------------
  // onCancelCreate – closes dialog when open
  // ---------------------------------------------------------------------------
  QUnit.module("Create Controller – onCancelCreate", {
    beforeEach: function () {
      this.oController = new CreateController();
      this.oViewStub   = buildViewStub();
      this.oController.init(this.oViewStub, buildODataStub());
    }
  });

  QUnit.test("Closes dialog when _oDialog is set", function (assert) {
    var closeSpy = sinon.spy();
    this.oController._oDialog = { close: closeSpy };

    this.oController.onCancelCreate();

    assert.ok(closeSpy.calledOnce, "Dialog close() called");
  });

  QUnit.test("Does not crash when _oDialog is null", function (assert) {
    this.oController._oDialog = null;
    assert.expect(0); // No assertion needed – test passes if no exception is thrown
    this.oController.onCancelCreate();
  });
});
