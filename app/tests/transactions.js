'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    Category = mongoose.model('Category'),
    Account = mongoose.model('Account'),
    Transaction = mongoose.model('Transaction');

/**
 * Globals
 */
var user, transaction, company, category, account;

/**
 * Unit tests
 */
describe('Transaction Model Unit Tests:', function () {
    beforeEach(function (done) {
        user = new User({
            firstName: 'Full',
            lastName: 'Name',
            displayName: 'Full Name',
            email: 'test@test.com',
            username: 'username',
            password: 'password'
        });

        company = new Company({
            name: '朱墨科技',
            owner: user,
        });

        user.save(function () {
            company.save(function () {
                transaction = new Transaction ({
                    company: company,
                    createdBy: user,
                });
                done();
            });

        });
    });

    describe('new transaction', function () {
        it('should be able to save without problems', function (done) {
            return transaction.save(function (err) {
                should.not.exist(err);
                done();
            });
        });
    });

    afterEach(function (done) {
        Transaction.remove().exec();
        Company.remove().exec();
        Category.remove().exec();
        Account.remove().exec();
        User.remove().exec();
        done();
    });
});
