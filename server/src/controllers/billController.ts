import fs from 'fs/promises';
import cloudinary from "@/config/cloudinary";
import { RequestHandler } from "express";
import agent from "@/agent/base.agent";
import prisma from "@/config/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from 'zod';

const ApplianceSchema = z.object({
    name: z.string().min(1, "Appliance name is required"),
    avgUsageHours: z.number().min(0, "Usage hours must be positive").max(24, "Usage hours cannot exceed 24"),
    wattage: z.number().min(0, "Wattage must be positive").optional()
});

const ChatMessageSchema = z.object({
    conversationId: z.string().uuid("Invalid conversation ID"),
    message: z.string().min(1, "Message cannot be empty").max(1000, "Message too long")
});

export const analyzeBill: RequestHandler = async (req, res) => {
    const file = req.file;
    if (!file) return res.fail(400, "FILE_MISSING", "Please provide a bill image");

    const userId = req.user?.id;
    if (!userId) return res.fail(401, "UNAUTHORIZED", "User not authenticated");

    let appliances: Array<{ name: string; avgUsageHours: number; wattage?: number }> = [];
    if (req.body.appliances) {
        try {
            const parsed = JSON.parse(req.body.appliances);
            const validation = z.array(ApplianceSchema).safeParse(parsed);
            if (!validation.success) {
                return res.fail(400, "INVALID_APPLIANCES", validation.error.issues[0].message);
            }
            appliances = validation.data;
        } catch {
            return res.fail(400, "INVALID_JSON", "Appliances data must be valid JSON");
        }
    }

    try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
            asset_folder: "sharow/bills",
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true
        });

        const imageUrl = uploadResult.secure_url;

        try {
            await fs.unlink(file.path);
        } catch (error) {
            console.error("Error unlinking file:", file.path);
        }

        const agentResult = await agent.run({ 
            imageUrl, 
            appliances 
        });

        if (agentResult?.error) {
            return res.fail(400, "BILL_ANALYSIS_FAILED", agentResult.error.message);
        }

        const billData = agentResult.output;
        const conversationHistory = agentResult.history || [];

        const bill = await prisma.bill.create({
            data: {
                userId,
                billNumber: billData.id,
                totalAmount: billData.totalAmount,
                unitsConsumed: billData.unitsConsumed,
                billingDate: billData.billingDate,
                applianceBreakdown: billData.applianceBreakdown,
                shadowWaste: billData.shadowWaste,
                analysis: billData.analysis,
                tips: billData.tips,
                unusualConsumption: billData.unusualConsumption,
                potentialSavings: billData.potentialSavings,
                imageUrl,
            }
        });

        const conversation = await prisma.conversation.create({
            data: {
                userId,
                billId: bill.id,
                history: JSON.parse(JSON.stringify(conversationHistory)) as Prisma.InputJsonValue
            }
        });

        return res.success(201, {
            bill,
            conversationId: conversation.id
        }, "Bill analyzed successfully");

    } catch (error: any) {
        console.error("Bill analysis error:", error);
        return res.fail(500, "INTERNAL_ERROR", "Failed to analyze bill");
    }
};

export const chatWithBill: RequestHandler = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.fail(401, "UNAUTHORIZED", "User not authenticated");

    const validation = ChatMessageSchema.safeParse(req.body);
    if (!validation.success) {
        return res.fail(400, "VALIDATION_ERROR", validation.error.issues[0].message);
    }

    const { conversationId, message } = validation.data;

    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { bill: true }
        });

        if (!conversation) {
            return res.fail(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
        }

        if (conversation.userId !== userId) {
            return res.fail(403, "FORBIDDEN", "You don't have access to this conversation");
        }

        const agentResult = await agent.run({
            message,
            history: conversation.history as any
        });

        if (agentResult?.error) {
            return res.fail(400, "CHAT_FAILED", agentResult.error.message);
        }

        const updatedConversation = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                history: JSON.parse(JSON.stringify(agentResult.history || conversation.history)) as Prisma.InputJsonValue
            }
        });

        return res.success(200, {
            response: agentResult.output,
            conversationId: updatedConversation.id
        }, "Message processed successfully");

    } catch (error: any) {
        console.error("Chat error:", error);
        return res.fail(500, "INTERNAL_ERROR", "Failed to process message");
    }
};

export const getUserBills: RequestHandler = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.fail(401, "UNAUTHORIZED", "User not authenticated");

    try {
        const bills = await prisma.bill.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                conversations: {
                    select: {
                        id: true,
                        createdAt: true
                    }
                }
            }
        });

        return res.success(200, { bills }, "Bills retrieved successfully");
    } catch (error: any) {
        console.error("Get bills error:", error);
        return res.fail(500, "INTERNAL_ERROR", "Failed to retrieve bills");
    }
};

export const getBillById: RequestHandler = async (req, res) => {
    const userId = req.user?.id;
    const billId = Array.isArray(req.params.billId) ? req.params.billId[0] : req.params.billId;

    if (!userId) return res.fail(401, "UNAUTHORIZED", "User not authenticated");
    if (!billId) return res.fail(400, "MISSING_BILL_ID", "Bill ID is required");

    try {
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                conversations: true
            }
        });

        if (!bill) {
            return res.fail(404, "BILL_NOT_FOUND", "Bill not found");
        }

        if (bill.userId !== userId) {
            return res.fail(403, "FORBIDDEN", "You don't have access to this bill");
        }

        return res.success(200, { bill }, "Bill retrieved successfully");
    } catch (error: any) {
        console.error("Get bill error:", error);
        return res.fail(500, "INTERNAL_ERROR", "Failed to retrieve bill");
    }
};
