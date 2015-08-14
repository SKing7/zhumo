'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    Member = mongoose.model('Member'),
    Category = mongoose.model('Category'),
    Account = mongoose.model('Account');

/**
 * Globals
 */
var user, name;

/**
 * Unit tests
 */
describe('User Model:', function () {
    beforeEach(function (done) {
        user = new User({
            email: 'test@test.com',
            password: 'password',
            provider: 'local',
        });

        name = '朱墨科技';

        done();
    });

    describe('add company', function () {
        it('should be able to add company and membership correctly', function (done) {
            user.save(function (err, user) {
                should.not.exist(err);
                // console.log(user.toObject());

                user.addCompany(name, function (err, company, membership) {
                    should.not.exist(err);

                    // console.log(company.toObject());
                    // console.log(membership.toObject());

                    should(company).have.property('name');
                    should(company).have.property('owner');

                    should(membership).have.property('company');
                    should(membership).have.property('user');
                    should(membership).have.property('isVerified');

                    should.equal(company.name, '朱墨科技');
                    should.equal(company.owner.toString(), user._id.toString());
                    should.equal(membership.user.toString(), user._id.toString());
                    should.equal(membership.company.toString(), company._id.toString());

                    user.getCompanies(function (err, data) {
                        should.equal(data.length, 1);
                        should.equal(data[0].name, '朱墨科技');
                        done();
                    });

                });
            });
        });

    });

    afterEach(function (done) {
        Category.remove().exec();
        Account.remove().exec();
        Company.remove().exec();
        Member.remove().exec();
        User.remove().exec();
        done();
    });

});

