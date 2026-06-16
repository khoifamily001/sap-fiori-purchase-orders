sap.ui.define([
  "sap/ui/thirdparty/sinon",
  "sap/m/MessageBox",
  "purchaseorders/controller/Detail.controller"
], function (sinon, MessageBox, DetailController) {
  "use strict";

  // ---------------------------------------------------------------------------
  // Formatter tests – pure functions, no mocks needed
  // ---------------------------------------------------------------------------
  QUnit.module("Detail Controller – formatStatusText", {
    beforeEach: function () {
      this.oController = new DetailController();
    }
  });

  QUnit.test("'01' returns 'Version in Arbeit'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("01"), "Version in Arbeit");
  });

  QUnit.test("'02' returns 'Aktiv'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("02"), "Aktiv");
  });

  QUnit.test("'03' returns 'In Freigabe'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("03"), "In Freigabe");
  });

  QUnit.test("'04' returns 'Freigabe teilweise'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("04"), "Freigabe teilweise");
  });

  QUnit.test("'05' returns 'Freigabe abgeschlossen'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("05"), "Freigabe abgeschlossen");
  });

  QUnit.test("'08' returns 'Abgelehnt'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("08"), "Abgelehnt");
  });

  QUnit.test("'26' returns 'In externer Genehmigung'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("26"), "In externer Genehmigung");
  });

  QUnit.test("Unknown code is returned as-is", function (assert) {
    assert.strictEqual(this.oController.formatStatusText("99"), "99");
  });

  QUnit.test("Falsy value returns '–'", function (assert) {
    assert.strictEqual(this.oController.formatStatusText(undefined), "–");
    assert.strictEqual(this.oController.formatStatusText(""), "–");
    assert.strictEqual(this.oController.formatStatusText(null), "–");
  });

  // ---------------------------------------------------------------------------
  QUnit.module("Detail Controller – formatStatusState", {
    beforeEach: function () {
      this.oController = new DetailController();
    }
  });

  QUnit.test("'01' returns 'None'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("01"), "None");
  });

  QUnit.test("'02' returns 'Success'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("02"), "Success");
  });

  QUnit.test("'03' (In Freigabe) returns 'Warning'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("03"), "Warning");
  });

  QUnit.test("'05' returns 'Success'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("05"), "Success");
  });

  QUnit.test("'08' (Abgelehnt) returns 'Error'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("08"), "Error");
  });

  QUnit.test("'11' returns 'Information'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("11"), "Information");
  });

  QUnit.test("'12' returns 'Error'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("12"), "Error");
  });

  QUnit.test("Unknown code returns 'None'", function (assert) {
    assert.strictEqual(this.oController.formatStatusState("99"), "None");
  });

  // ---------------------------------------------------------------------------
  QUnit.module("Detail Controller – formatAmount", {
    beforeEach: function () {
      this.oController = new DetailController();
    }
  });

  QUnit.test("Null amount returns '–'", function (assert) {
    assert.strictEqual(this.oController.formatAmount(null, "EUR"), "–");
  });

  QUnit.test("Undefined amount returns '–'", function (assert) {
    assert.strictEqual(this.oController.formatAmount(undefined, "EUR"), "–");
  });

  QUnit.test("Zero returns '–' (falsy)", function (assert) {
    assert.strictEqual(this.oController.formatAmount(0, "EUR"), "–");
  });

  QUnit.test("Valid amount contains thousands separator and currency", function (assert) {
    var sResult = this.oController.formatAmount("1234.50", "EUR");
    assert.ok(sResult.indexOf("1.234") !== -1, "de-DE thousands separator present");
    assert.ok(sResult.indexOf("EUR") !== -1, "Currency code present");
  });

  QUnit.test("Non-numeric string is returned as-is", function (assert) {
    assert.strictEqual(this.oController.formatAmount("abc", "EUR"), "abc");
  });

  // ---------------------------------------------------------------------------
  QUnit.module("Detail Controller – formatDate", {
    beforeEach: function () {
      this.oController = new DetailController();
    }
  });

  QUnit.test("Null returns '–'", function (assert) {
    assert.strictEqual(this.oController.formatDate(null), "–");
  });

  QUnit.test("Undefined returns '–'", function (assert) {
    assert.strictEqual(this.oController.formatDate(undefined), "–");
  });

  QUnit.test("Date object is formatted in de-DE format (dd.mm.yyyy)", function (assert) {
    var oDate   = new Date(2024, 0, 5); // 5 Jan 2024
    var sResult = this.oController.formatDate(oDate);
    assert.strictEqual(sResult, "05.01.2024");
  });

  QUnit.test("ISO string contains the correct year", function (assert) {
    var sResult = this.oController.formatDate("2024-06-16T00:00:00");
    assert.ok(sResult.indexOf("2024") !== -1, "Year 2024 is present in formatted output");
  });

  // ---------------------------------------------------------------------------
  // onNavBack
  //
  // getOwnerComponent is also a prototype method. Same rule applies:
  // assign a plain object directly to oComponent (the internal property)
  // instead of trying to sinon.stub the prototype method.
  // ---------------------------------------------------------------------------
  QUnit.module("Detail Controller – onNavBack", {
    beforeEach: function () {
      this.oController = new DetailController();
      this.navToSpy    = sinon.spy();

      var self = this;
      // getOwnerComponent uses an internal registry, not a plain property.
      // sinon.stub works here now that sinon-qunit is removed.
      sinon.stub(this.oController, "getOwnerComponent").returns({
        getRouter: function () {
          return { navTo: self.navToSpy };
        }
      });
    },
    afterEach: function () {
      this.oController.getOwnerComponent.restore();
    }
  });

  QUnit.test("Calls navTo with 'list'", function (assert) {
    this.oController.onNavBack();
    assert.ok(this.navToSpy.calledOnce, "navTo called exactly once");
    assert.ok(this.navToSpy.calledWith("list"), "navTo called with 'list'");
  });

  // ---------------------------------------------------------------------------
  // onApprove / onReject
  // MessageBox lives outside the controller so sinon.stub works fine here –
  // it is a plain module-level object, not a UI5 prototype method.
  // ---------------------------------------------------------------------------
  QUnit.module("Detail Controller – onApprove / onReject", {
    beforeEach: function () {
      this.oController = new DetailController();
      this.confirmStub = sinon.stub(MessageBox, "confirm");
    },
    afterEach: function () {
      this.confirmStub.restore();
    }
  });

  QUnit.test("onApprove calls MessageBox.confirm with correct title", function (assert) {
    this.oController.onApprove();
    assert.ok(this.confirmStub.calledOnce, "MessageBox.confirm was called");
    assert.strictEqual(
      this.confirmStub.firstCall.args[1].title,
      "Genehmigen bestätigen"
    );
  });

  QUnit.test("onReject calls MessageBox.confirm with correct title", function (assert) {
    this.oController.onReject();
    assert.ok(this.confirmStub.calledOnce, "MessageBox.confirm was called");
    assert.strictEqual(
      this.confirmStub.firstCall.args[1].title,
      "Ablehnen bestätigen"
    );
  });
});
