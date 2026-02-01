const { FinanceTransaction, Store, User, Sequelize } = require('../models');
const { Op } = Sequelize;
const ExcelJS = require('exceljs');

module.exports = {
    // Create a new transaction (Income/Expense)
    async createTransaction(req, res) {
        try {
            const { store_id, type, amount, category, description, date } = req.body;
            const userId = req.user.id; // From auth middleware

            // Validate store access
            // In a real app, middleware should check if user belongs to store if not Admin
            // For now, we assume frontend/middleware handles basic checks

            const store = await Store.findByPk(store_id);
            if (!store) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }

            // Calculate current balance (simple version: sum of all previous transactions)
            // Ideally, we might cache this or store it on the Store model, but aggregation is safer for consistency
            const previousBalance = await FinanceTransaction.sum('amount', {
                where: {
                    store_id,
                    type: 'INCOME' // This is just a placeholder logic, see complex calc below
                }
            }) || 0;

            // REAL Logic: Sum(Income) - Sum(Expense)
            const totalIncome = await FinanceTransaction.sum('amount', { where: { store_id, type: 'INCOME' } }) || 0;
            const totalExpense = await FinanceTransaction.sum('amount', { where: { store_id, type: 'EXPENSE' } }) || 0;
            const currentBalance = totalIncome - totalExpense;

            // New Balance Calculation
            // If INCOME, Add. If EXPENSE, Subtract.
            // Note: We are calculating 'balance_after' for THIS transaction record.
            const transactionAmount = parseFloat(amount);
            const newBalance = type === 'INCOME'
                ? currentBalance + transactionAmount
                : currentBalance - transactionAmount;

            const transaction = await FinanceTransaction.create({
                store_id,
                user_id: userId,
                type,
                amount: transactionAmount,
                category,
                description,
                transaction_date: date || new Date(),
                balance_after: newBalance
            });

            return res.status(201).json({
                success: true,
                data: transaction,
                message: 'Transaction recorded successfully'
            });
        } catch (error) {
            console.error('Error create transaction:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to record transaction',
                error: error.message
            });
        }
    },

    // Get transactions with filters
    async getTransactions(req, res) {
        try {
            const { store_id } = req.params;
            const { startDate, endDate, type, limit = 20, page = 1 } = req.query;
            const offset = (page - 1) * limit;

            const where = { store_id };

            if (startDate && endDate) {
                where.transaction_date = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            } else if (startDate) {
                where.transaction_date = {
                    [Op.gte]: new Date(startDate)
                };
            }

            if (type) {
                where.type = type;
            }

            const { count, rows } = await FinanceTransaction.findAndCountAll({
                where,
                include: [
                    { model: User, as: 'PIC', attributes: ['name'] }
                ],
                order: [['transaction_date', 'DESC'], ['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return res.status(200).json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch transactions',
                error: error.message
            });
        }
    },

    // Get Summary/Recap (Daily, Monthly, Total)
    async getRecap(req, res) {
        try {
            const { store_id } = req.params;
            const { period = 'monthly', date } = req.query; // date for reference, defaults to now

            const where = { store_id };

            // Period filtering for Income/Expense Logic
            // Note: Current Balance is usually "All Time", but Income/Expense should be for the period

            let dateFilter = {};
            const now = date ? new Date(date) : new Date();

            if (period === 'daily') {
                const start = new Date(now.setHours(0, 0, 0, 0));
                const end = new Date(now.setHours(23, 59, 59, 999));
                dateFilter = { [Op.between]: [start, end] };
            } else if (period === 'weekly') {
                // Start of week (Monday) to End of week (Sunday)
                // Adjust per locale if needed, here assuming standard
                const day = now.getDay() || 7; // Get current day number, converting Sun (0) to 7
                if (day !== 1) now.setHours(-24 * (day - 1)); // Go back to Monday
                else now.setHours(0, 0, 0, 0); // It is monday

                const start = new Date(now);
                start.setHours(0, 0, 0, 0);

                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);

                dateFilter = { [Op.between]: [start, end] };
            } else if (period === 'monthly') {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                dateFilter = { [Op.between]: [start, end] };
            }
            // 'all' or empty -> no date filter

            // Calculate Period Income/Expense
            const totalIncome = await FinanceTransaction.sum('amount', {
                where: {
                    store_id,
                    type: 'INCOME',
                    ...(period !== 'all' ? { transaction_date: dateFilter } : {})
                }
            }) || 0;

            const totalExpense = await FinanceTransaction.sum('amount', {
                where: {
                    store_id,
                    type: 'EXPENSE',
                    ...(period !== 'all' ? { transaction_date: dateFilter } : {})
                }
            }) || 0;

            // Current Balance (All Time)
            // We calculate this separately because Balance is a snapshot of "what we have now"
            // regardless of the view period.
            const allTimeIncome = await FinanceTransaction.sum('amount', { where: { store_id, type: 'INCOME' } }) || 0;
            const allTimeExpense = await FinanceTransaction.sum('amount', { where: { store_id, type: 'EXPENSE' } }) || 0;
            const currentBalance = allTimeIncome - allTimeExpense;

            return res.status(200).json({
                success: true,
                data: {
                    total_income: totalIncome,
                    total_expense: totalExpense,
                    current_balance: currentBalance,
                    period,
                    date_filter: dateFilter
                }
            });
        } catch (error) {
            console.error('Error fetching recap:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch recap',
                error: error.message
            });
        }
    },

    // Export Transactions to Excel
    async exportTransactions(req, res) {
        try {
            const { store_id } = req.params;
            const { startDate, endDate, type } = req.query;

            const store = await Store.findByPk(store_id);
            if (!store) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }

            const where = { store_id };
            if (startDate && endDate) {
                where.transaction_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
            } else if (startDate) {
                where.transaction_date = { [Op.gte]: new Date(startDate) };
            }
            if (type) where.type = type;

            const transactions = await FinanceTransaction.findAll({
                where,
                include: [{ model: User, as: 'PIC', attributes: ['name'] }],
                order: [['transaction_date', 'ASC'], ['created_at', 'ASC']]
            });

            // Calculate Totals for Summary
            const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const currentBalance = totalIncome - totalExpense;

            // Workbook Creation
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Laporan Keuangan');

            // --- Header Section ---
            worksheet.getCell('A1').value = 'Akun';
            worksheet.getCell('B1').value = 'Toko';
            worksheet.getCell('C1').value = store.name;
            worksheet.getCell('A1').font = { bold: true };
            worksheet.getCell('B1').font = { bold: true };

            // Grid Styling Helper
            const addBorder = (cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            };

            // --- Summary Section (Row 3-5) ---
            worksheet.getCell('A3').value = 'Pic';
            worksheet.getCell('C3').value = 'Kredit';
            worksheet.getCell('E3').value = 'Debit';
            worksheet.getCell('F3').value = 'Saldo';
            ['A3', 'C3', 'E3', 'F3'].forEach(key => {
                worksheet.getCell(key).font = { bold: true };
            });

            // Fill Summary Values (Row 4 or 5)
            // Note: Reference image puts final saldo at G4. matching structure roughly.
            // Let's use Row 4 for values.
            worksheet.getCell('C4').value = totalIncome;
            worksheet.getCell('E4').value = totalExpense;
            worksheet.getCell('G4').value = currentBalance;
            // Format numbers
            ['C4', 'E4', 'G4'].forEach(key => worksheet.getCell(key).numFmt = '#,##0.00');


            // --- Transaction Table Header (Row 6) ---
            const tableHeadRow = 6;
            const headers = ['ID Transaksi', 'Waktu', 'Kategori', 'Kredit', 'Debit', 'Saldo', 'Keterangan', 'PIC'];
            // Columns: A=ID, B=Waktu, C=Kategori, D=Kredit, E=Debit, F=Saldo, G=Keterangan, H=PIC
            worksheet.getRow(tableHeadRow).values = headers;
            worksheet.getRow(tableHeadRow).font = { bold: true };

            // Apply borders to header
            for (let i = 1; i <= headers.length; i++) {
                addBorder(worksheet.getRow(tableHeadRow).getCell(i));
            }

            // --- Transaction Data (Row 7+) ---
            let currentRow = 7;
            let runningBalance = 0;

            transactions.forEach(trx => {
                const amount = parseFloat(trx.amount);
                const isIncome = trx.type === 'INCOME';

                // Adjust running balance
                if (isIncome) runningBalance += amount;
                else runningBalance -= amount;

                const rowData = [
                    trx.id,
                    new Date(trx.transaction_date).toLocaleString('id-ID'),
                    trx.category,
                    isIncome ? amount : null, // Kredit
                    !isIncome ? amount : null, // Debit
                    runningBalance, // Saldo Running
                    trx.description,
                    trx.PIC?.name || '-'
                ];

                const row = worksheet.getRow(currentRow);
                row.values = rowData;

                // Farming & Borders
                row.getCell(4).numFmt = '#,##0.00'; // Kredit
                row.getCell(5).numFmt = '#,##0.00'; // Debit
                row.getCell(6).numFmt = '#,##0.00'; // Saldo

                for (let i = 1; i <= headers.length; i++) {
                    addBorder(row.getCell(i));
                }

                currentRow++;
            });

            // Adjust Column Widths
            worksheet.columns = [
                { width: 15 }, // ID
                { width: 22 }, // Waktu
                { width: 20 }, // Kategori
                { width: 18 }, // Kredit
                { width: 18 }, // Debit
                { width: 18 }, // Saldo
                { width: 40 }, // Keterangan
                { width: 15 }  // PIC
            ];

            // Set Response Headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Laporan_${store.name}_${new Date().toISOString().slice(0, 10)}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('Error export excel:', error);
            // If headers sent, we can't send JSON error, but stream logic usually handles this before write
            if (!res.headersSent) {
                return res.status(500).json({ success: false, message: 'Export failed' });
            }
        }
    },

    // Delete transaction
    async deleteTransaction(req, res) {
        try {
            const { id } = req.params;

            const transaction = await FinanceTransaction.findByPk(id);
            if (!transaction) {
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }

            await transaction.destroy();

            return res.status(200).json({
                success: true,
                message: 'Transaction deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting transaction:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete transaction',
                error: error.message
            });
        }
    }
};
