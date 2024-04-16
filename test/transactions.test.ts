import {
    afterAll,
    beforeAll,
    expect,
    test,
    describe,
    beforeEach,
} from 'vitest';
import { execSync } from 'node:child_process';
import request from 'supertest';
import { app } from '../src/app';

describe('Transactions Routes', () => {
    beforeAll(async () => {
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        execSync('npm run knex migrate:rollback --all');
        execSync('npm run knex migrate:latest');
    });

    test('CREATE TRANSACTION', async () => {
        const response = await request(app.server).post('/transactions').send({
            title: 'New transaction',
            amount: 5000,
            type: 'credit',
        });

        expect(response.statusCode).toEqual(201);
    });

    test('LIST TRANSACTIONS', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit',
            });

        const cookies = createTransactionResponse.get('Set-Cookie') as string[];

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies);

        expect(listTransactionsResponse.statusCode).toEqual(200);
        expect(listTransactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000,
            }),
        ]);
    });

    test('LIST TRANSACTION BY ID', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit',
            });

        const cookies = createTransactionResponse.get('Set-Cookie') as string[];

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies);

        const transactionId = listTransactionsResponse.body.transactions[0].id;

        const getTransactionByIdResponse = await request(app.server)
            .get(`/transactions/${transactionId}`)
            .set('Cookie', cookies);

        expect(getTransactionByIdResponse.statusCode).toEqual(200);
        expect(getTransactionByIdResponse.body.transaction).toEqual(
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000,
            }),
        );
    });

    test('LIST SUMMARY', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit',
            });

        const cookies = createTransactionResponse.get('Set-Cookie') as string[];

        await request(app.server)
            .post('/transactions')
            .set('Cookie', cookies)
            .send({
                title: 'Debit transaction',
                amount: 2000,
                type: 'debit',
            });

        const summaryResponse = await request(app.server)
            .get('/transactions/summary')
            .set('Cookie', cookies);

        expect(summaryResponse.statusCode).toEqual(200);
        expect(summaryResponse.body.summary).toEqual({
            amount: 3000,
        });
    });
});
