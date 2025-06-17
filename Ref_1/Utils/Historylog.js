import { History } from "../Models/User/History.js";

/**
 * Function to log history of any operation
 * @param {Object} options - The input object with operation details.
 * @param {ObjectId} options.userId - ID of the user performing the operation.
 * @param {String} options.userName - Name of the user.
 * @param {ObjectId} options.avatarId - ID of the avatar.
 * @param {String} options.avatarName - Name of the avatar.
 * @param {ObjectId} options.experienceId - ID of the experience (optional).
 * @param {String} options.experienceName - Name of the experience (optional).
 * @param {String} options.paymentStatus - Status of the payment (optional).
 * @param {String} options.experienceStatus - Status of the experience (optional).
 * @param {Number} options.rating - Rating given for the experience (optional).
 * @param {String} options.comments - Comments given for the experience (optional).
 * @param {Number} options.amount - Amount involved in the operation (optional).
 * @param {Number} options.refunds - Refund amount (optional).
 * @param {String} options.refundStatus - Status of the refund (optional).
 * @param {String} options.meetingStatus - Status of the meeting (optional).
 * @param {String} options.errorCode - Status of the meeting (optional).
 * @param {String} options.errormsg - Status of the meeting (optional).
 * @param {String} options.errorthrow - Status of the meeting (optional).
 * @param {String} options.action - Status of the meeting (optional).
 * @param {String} options.id - Status of the meeting (optional).
 * @returns {Object} - The saved history document.
 */
export const createHistoryLog = async (options) => {
    try {
        const history = new History({
            userId: options.userId,
            userName: options.userName,
            avatarId: options.avatarId,
            status:options.status,
            avatarName: options.avatarName,
            experienceId: options.experienceId,
            experienceName: options.experienceName,
            paymentStatus: options.paymentStatus,
            experienceStatus: options.experienceStatus,
            rating: options.rating,
            comments: options.comments,
            amount: options.amount,
            refunds: options.refunds,
            refundStatus: options.refundStatus,
            meetingStatus: options.meetingStatus,
            errorCode:options.errorCode,
            errormsg:options.errormsg,
            errorthrow:options.errorthrow,
            action:options.action,
            id:options.id
        });

        const savedHistory = await history.save();
        return savedHistory;
    } catch (error) {
        console.error('Error creating history log:', error);
        throw error;
    }
};