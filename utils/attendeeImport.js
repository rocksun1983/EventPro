import { parse } from "csv-parse/sync";
import xlsx from "xlsx";

const HEADER_MAP = {
  "first name": "firstName",
  "firstname": "firstName",
  "first_name": "firstName",
  "last name": "lastName",
  "lastname": "lastName",
  "last_name": "lastName",
  "email": "email",
  "email address": "email",
  "phone": "phone",
  "phone number": "phone",
  "ticket type": "ticketType",
  "ticket_type": "ticketType",
  "status": "status"
};

const normalizeHeader = (header) => {
  if (!header) return "";
  const key = header.toString().trim().toLowerCase();
  return HEADER_MAP[key] || key.replace(/\s+/g, "_");
};

const normalizeRow = (row) => {
  const normalized = {};

  for (const [key, value] of Object.entries(row)) {
    const mapped = normalizeHeader(key);
    if (mapped === "firstName") normalized.firstName = value;
    if (mapped === "lastName") normalized.lastName = value;
    if (mapped === "email") normalized.email = value;
    if (mapped === "phone") normalized.phone = value;
    if (mapped === "ticketType") normalized.ticketType = value;
    if (mapped === "status") normalized.status = value;
  }

  return normalized;
};

const parseCsv = (buffer) => {
  const text = buffer.toString("utf8");
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records.map((record, index) => ({
    __row: index + 2,
    ...normalizeRow(record)
  }));
};

const parseXlsx = (buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  return rows.map((record, index) => ({
    __row: index + 2,
    ...normalizeRow(record)
  }));
};

const getFileType = (file) => {
  const name = (file.originalname || "").toLowerCase();
  if (name.endsWith(".xlsx") || file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return "xlsx";
  }
  if (name.endsWith(".xls") || file.mimetype === "application/vnd.ms-excel") {
    return "xlsx";
  }
  return "csv";
};

export const parseAttendeeFile = (file) => {
  const type = getFileType(file);
  if (type === "xlsx") {
    return parseXlsx(file.buffer);
  }

  return parseCsv(file.buffer);
};
