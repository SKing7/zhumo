'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    Category = mongoose.model('Category'),
    Account = mongoose.model('Account');

/**
 * Globals
 */
var user, child, company;

/**
 * Unit tests
 */
describe('Company Model:', function () {
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
            done();
        });
    });

    describe('new company', function () {
        it('should be able to save without problems', function (done) {
            return company.save(function (err) {
                should.not.exist(err);

                should(company).have.property('name');
                should(company).have.property('owner');

                done();
            });
        });

        it('should be able to show an error when try to save without name', function (done) {
            company.name = '';

            return company.save(function (err) {
                should.exist(err);
                done();
            });
        });

        it('should be able to show an error when try to save without owner', function (done) {
            company.owner = '';

            return company.save(function (err) {
                should.exist(err);
                done();
            });
        });

        it('should be able to create categories and accounts after save', function (done) {
            return company.save(function (err) {
                should.not.exist(err);
                done();
            });
        });

    });

    afterEach(function (done) {
        Category.remove().exec();
        Account.remove().exec();
        Company.remove().exec();
        User.remove().exec();
        done();
    });

});

