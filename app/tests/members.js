'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    Member = mongoose.model('Member');

/**
 * Globals
 */
var user, member, company;

/**
 * Unit tests
 */
describe('Member Model Unit Tests:', function () {
    beforeEach(function (done) {
        user = new User({
            email: 'test@test.com',
            password: 'password'
        });

        user.save(function () {
            company = new Company({
                name: 'test',
                owner: user,
            });

            company.save(function() {
                member = new Member({
                    company: company,
                    user: user,
                    role: 'owner',
                });
                done();
            });

        });
    });

    describe('Method Save', function () {
        it('should be able to save without problems', function (done) {
            return member.save(function (err) {
                should.not.exist(err);
                done();
            });
        });

        it('should be able to show an error when try to save without company', function (done) {
            member.company = '';

            return member.save(function (err) {
                should.exist(err);
                done();
            });
        });

        it('should be able to show an error when try to save without role', function (done) {
            member.role = '';

            return member.save(function (err) {
                should.exist(err);
                done();
            });
        });

        it('should be able to show an error when try to save with incorrect role', function (done) {
            member.role = 'nothing';

            return member.save(function (err) {
                should.exist(err);
                done();
            });
        });
    });

    afterEach(function (done) {
        Member.remove().exec();
        Company.remove().exec();
        User.remove().exec();
        done();
    });
});
