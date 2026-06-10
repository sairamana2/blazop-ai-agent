// skills/slack-database.js
// MongoDB persistence for tickets, approvals, and audit logs

const mongoose = require('mongoose');

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ticketSchema = new mongoose.Schema({
  ticketId:    { type: Number, required: true, unique: true },
  description: { type: String, required: true },
  createdBy:   { type: String, required: true },
  channel:     { type: String, required: true },
  priority:    { type: String, default: 'Medium' },
  status:      { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  approvedBy:  { type: String, default: null },
  actionAt:    { type: Date, default: null },
  emailSent:   { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
});

const auditSchema = new mongoose.Schema({
  action:     { type: String, required: true },
  ticketId:   { type: Number },
  userId:     { type: String },
  channel:    { type: String },
  details:    { type: Object },
  timestamp:  { type: Date, default: Date.now }
});

const Ticket = mongoose.model('Ticket', ticketSchema);
const AuditLog = mongoose.model('AuditLog', auditSchema);

// ─── Connection ───────────────────────────────────────────────────────────────

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected: blazop-db');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Running without database persistence');
  }
}

// ─── Ticket Counter (replaces in-memory counter) ──────────────────────────────

const CounterSchema = new mongoose.Schema({
  name:  { type: String, required: true, unique: true },
  value: { type: Number, default: 100 }
});
const Counter = mongoose.model('Counter', CounterSchema);

async function getNextTicketId() {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'ticketId' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    return counter.value;
  } catch (error) {
    // Fallback to timestamp-based ID if DB unavailable
    return Math.floor(Date.now() / 1000) % 100000;
  }
}

// ─── Ticket Operations ────────────────────────────────────────────────────────

async function createTicket(ticketData) {
  try {
    const ticket = new Ticket(ticketData);
    await ticket.save();
    console.log(`💾 Ticket #${ticketData.ticketId} saved to DB`);
    return ticket;
  } catch (error) {
    console.error('💾 Save ticket error:', error.message);
    return null;
  }
}

async function updateTicketStatus(ticketId, status, approvedBy) {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId },
      { status, approvedBy, actionAt: new Date() },
      { new: true }
    );
    console.log(`💾 Ticket #${ticketId} updated to ${status}`);
    return ticket;
  } catch (error) {
    console.error('💾 Update ticket error:', error.message);
    return null;
  }
}

async function getTicket(ticketId) {
  try {
    return await Ticket.findOne({ ticketId });
  } catch (error) {
    return null;
  }
}

async function getAllTickets() {
  try {
    return await Ticket.find().sort({ createdAt: -1 }).limit(50);
  } catch (error) {
    return [];
  }
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

async function logAction(action, details = {}) {
  try {
    await AuditLog.create({ action, ...details });
  } catch (error) {
    console.error('💾 Audit log error:', error.message);
  }
}

module.exports = {
  connectDB,
  createTicket,
  updateTicketStatus,
  getTicket,
  getAllTickets,
  getNextTicketId,
  logAction
};