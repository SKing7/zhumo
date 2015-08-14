'use strict';

var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    Account = mongoose.model('Account');

/**
 * Globals
 */
var user, account, child, company;

/**
 * Unit tests
 */
describe('Account Model:', function () {
    beforeEach(function (done) {
        user = new User({
            email: 'test@test.com',
            password: 'password'
        });

        company = new Company({
            name: '朱墨科技',
            owner: user,
        });

        user.save(function () {
            company.save(function () {
                account = new Account({
                    name: 'parent',
                    company: company,
                    createdBy: user
                });

                child = new Account({
                    name: 'child',
                    company: company,
                    createdBy: user
                });

                done();
            });
        });
    });

    describe('new account', function () {
        it('should be able to save without problems', function (done) {
            return account.save(function (err, account) {
                should.not.exist(err);

                should(account).have.property('name');
                should(account).have.property('createdBy');
                should(account).have.property('company');
                should(account).have.property('gmtCreated');

                should.equal(account.name, 'parent');
                should.equal(account.parentId, null);

                done();
            });
        });

        it('should be able to show an error when try to save without name', function (done) {
            account.name = '';

            return account.save(function (err) {
                should.exist(err);
                done();
            });
        });

        it('should be able to show an error when try to save without createdBy', function (done) {
            account.createdBy = '';

            return account.save(function (err) {
                should.exist(err);
                done();
            });
        });

        it('should be able to show an error when try to save without company', function (done) {
            account.company = '';

            return account.save(function (err) {
                should.exist(err);
                done();
            });
        });
    });

    describe('new child', function () {
        it('should Account.addChild work as expected: parentId, plain child object', function (done) {
            account.save(function (err, parent) {
                Account.addChild(parent._id, child, function(err, child) {
                    should.not.exist(err);

                    should(child).have.property('name');
                    should(child).have.property('createdBy');
                    should(child).have.property('company');
                    should(child).have.property('gmtCreated');

                    should(child).have.property('parentId');

                    should.equal(child.name, 'child');
                    should.equal(child.parentId.toString(), parent._id.toString());

                    var child2 = {
                        name: 'child2',
                        company: company,
                        createdBy: user
                    };

                    parent.addChild(child2, function (err, child2) {
                        should.equal(child2.name, 'child2');
                        should.equal(child2.parentId.toString(), parent._id.toString());

                        parent.children(function (err, children) {
                            should.equal(children.length, 2);
                            children.forEach(function (child) {
                                should.equal(child.parentId.toString(), parent._id.toString());
                            });
                            done();
                        });
                    });

                });
            });
        });

        it('should Account.addChild work as expected: parent instance and child instance', function (done) {
            account.save(function (err, parent) {
                parent.addChild(child, function(err, child) {
                    should.not.exist(err);

                    should(child).have.property('name');
                    should(child).have.property('createdBy');
                    should(child).have.property('company');
                    should(child).have.property('gmtCreated');

                    should(child).have.property('parentId');

                    should.equal(child.name, 'child');
                    should.equal(child.parentId.toString(), parent._id.toString());

                    var child2 = new Account({
                        name: 'child2',
                        company: company,
                        createdBy: user
                    });

                    parent.addChild(child2, function (err, child2) {
                        should.equal(child2.name, 'child2');
                        should.equal(child2.parentId.toString(), parent._id.toString());

                        parent.children(function (err, children) {
                            should.equal(children.length, 2);
                            children.forEach(function (child) {
                                should.equal(child.parentId.toString(), parent._id.toString());
                            });
                            done();
                        });
                    });

                });
            });
        });

    });

    describe('add defaults', function () {
        it('should Account.addDefaults work as expected', function (done) {
            Account.addDefaults(company, user, function(err) {
                should.not.exist(err);
                Account.getTreeByCompany(company, function (err, accounts) {
                    should.not.exist(err);
                    accounts.forEach(function (account) {
                        should(account).have.property('childNodes');
                    });
                    done();
                });
            });
        });
    });

    afterEach(function (done) {
        Account.remove().exec();
        Company.remove().exec();
        User.remove().exec();
        done();
    });
});
