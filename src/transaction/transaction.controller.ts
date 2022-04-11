import { BadRequestException, Body, Controller, InternalServerErrorException, Post } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Post('/')
    async addTransaction(
        @Body('senderPubKey') senderPubKey: string,
        @Body('senderPriKey') senderPriKey: string,
        @Body('receiverPubKey') receiverPubKey: string,
        @Body('receiveAmount') receiveAmountStr: string,
        @Body('fee') feeStr: string,
    ) {
        const attr = [senderPubKey, senderPriKey, receiverPubKey, receiveAmountStr, feeStr];

        attr.forEach((attribute) => {
            if (!attribute) {
                throw new BadRequestException('Missing required property');
            }
        });

        const receiveAmount = parseFloat(receiveAmountStr);
        const fee = parseFloat(feeStr);

        if (receiveAmount < 0) throw new BadRequestException('Invalid receive amount');
        if (fee < 0) throw new BadRequestException('Invalid fee');

        return this.transactionService
            .createTx(senderPubKey, senderPriKey, receiverPubKey, receiveAmount, fee)
            .then((tx) => {
                return tx;
            });
    }
}
