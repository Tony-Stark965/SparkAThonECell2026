import ExcelJS from "exceljs";
import type { RegistrationRecord } from "./supabase/types";
import { OFFICIAL_DOMAIN_CAPACITIES } from "./supabase/types";

export interface AttendanceDomainConfig {
  key: string;
  aliases: string[];
  displayName: string;
  maxTeams: number;
  csvFilename: string;
  xlsxFilename: string;
}

export const ATTENDANCE_DOMAINS: AttendanceDomainConfig[] = [
  {
    key: "AI and Cybersec",
    aliases: [
      "AI and Cybersec",
      "AI & Cybersec",
      "AI & CyberSec",
      "AI and CyberSec",
      "ai and cybersec",
      "ai & cybersec",
      "ai-cybersec",
    ],
    displayName: "AI & CyberSec",
    maxTeams: OFFICIAL_DOMAIN_CAPACITIES["AI and Cybersec"],
    csvFilename: "AI_and_CyberSec_Attendance.csv",
    xlsxFilename: "AI_and_CyberSec_Attendance.xlsx",
  },
  {
    key: "Smart Energy Systems",
    aliases: [
      "Smart Energy Systems",
      "smart energy systems",
      "smart-energy",
    ],
    displayName: "Smart Energy Systems",
    maxTeams: OFFICIAL_DOMAIN_CAPACITIES["Smart Energy Systems"],
    csvFilename: "Smart_Energy_Systems_Attendance.csv",
    xlsxFilename: "Smart_Energy_Systems_Attendance.xlsx",
  },
  {
    key: "Robotics or Drone and Fixed Wing",
    aliases: [
      "Robotics or Drone and Fixed Wing",
      "robotics or drone and fixed wing",
      "Robotics and Drones",
      "robotics-drones",
    ],
    displayName: "Robotics or Drone and Fixed Wing",
    maxTeams: OFFICIAL_DOMAIN_CAPACITIES["Robotics or Drone and Fixed Wing"],
    csvFilename: "Robotics_Drone_Fixed_Wing_Attendance.csv",
    xlsxFilename: "Robotics_Drone_Fixed_Wing_Attendance.xlsx",
  },
  {
    key: "IoT or Embedded Systems",
    aliases: [
      "IoT or Embedded Systems",
      "iot or embedded systems",
      "IoT & Embedded Systems",
      "iot-embedded",
    ],
    displayName: "IoT or Embedded Systems",
    maxTeams: OFFICIAL_DOMAIN_CAPACITIES["IoT or Embedded Systems"],
    csvFilename: "IoT_Embedded_Systems_Attendance.csv",
    xlsxFilename: "IoT_Embedded_Systems_Attendance.xlsx",
  },
  {
    key: "Open Innovation",
    aliases: [
      "Open Innovation",
      "open innovation",
      "open-innovation",
    ],
    displayName: "Open Innovation",
    maxTeams: OFFICIAL_DOMAIN_CAPACITIES["Open Innovation"],
    csvFilename: "Open_Innovation_Attendance.csv",
    xlsxFilename: "Open_Innovation_Attendance.xlsx",
  },
];

/**
 * Normalizes domain strings to allow robust matching across formatting variants
 */
function normalizeDomain(val: string): string {
  return val
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Checks if a registration record belongs to a specific domain configuration
 */
export function registrationMatchesDomain(
  regDomain: string | undefined | null,
  config: AttendanceDomainConfig
): boolean {
  if (!regDomain) return false;
  const norm = normalizeDomain(regDomain);
  if (norm === normalizeDomain(config.key) || norm === normalizeDomain(config.displayName)) {
    return true;
  }
  return config.aliases.some((alias) => normalizeDomain(alias) === norm);
}

/**
 * Safely extracts the ordered list of team members (leader + members) with their roll numbers
 */
export function getTeamMembersList(
  reg: RegistrationRecord
): Array<{ name: string; roll_no: string; isLeader?: boolean }> {
  if (Array.isArray(reg.participants) && reg.participants.length > 0) {
    return reg.participants.map((p, idx) => ({
      name: p.name?.trim() || (idx === 0 ? reg.team_leader_name?.trim() || "Team Leader" : `Member ${idx + 1}`),
      roll_no: p.roll_no?.trim() || (idx === 0 ? reg.team_leader_roll_no?.trim() || "" : ""),
      isLeader: idx === 0 || p.isLeader,
    }));
  }

  // Fallback for legacy or flat records
  return [
    {
      name: reg.team_leader_name?.trim() || "Team Leader",
      roll_no: reg.team_leader_roll_no?.trim() || "",
      isLeader: true,
    },
  ];
}

/**
 * Filters registered teams for a specific domain configuration
 */
export function getTeamsForDomain(
  registrations: RegistrationRecord[],
  domainConfig: AttendanceDomainConfig
): RegistrationRecord[] {
  return registrations.filter((reg) => registrationMatchesDomain(reg.domain, domainConfig));
}

/**
 * Escapes values for CSV output
 */
function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Generates exact CSV attendance sheet matching Section 3, 4, 7
 * Row 1: Spark-A-Thon 2026
 * Row 2: Domain Name
 * Row 3: Sr.no.,Team Name,Team Members,Roll No.,Signature
 */
export function generateAttendanceCsv(
  domainDisplayName: string,
  teams: RegistrationRecord[]
): string {
  const lines: string[] = [];

  // Row 1: Spark-A-Thon 2026
  lines.push(`"Spark-A-Thon 2026",,,,`);

  // Row 2: Domain Name
  lines.push(`"${domainDisplayName}",,,,`);

  // Row 3: Header Row
  lines.push(`"Sr.no.","Team Name","Team Members","Roll No.","Signature"`);

  // Data rows
  teams.forEach((team, teamIndex) => {
    const srNo = teamIndex + 1;
    const members = getTeamMembersList(team);

    members.forEach((member, memberIndex) => {
      const isFirst = memberIndex === 0;
      const srCell = isFirst ? String(srNo) : "";
      const teamCell = isFirst ? (team.team_name || "").trim() : "";
      const memberCell = (member.name || "").trim();
      const rollCell = (member.roll_no || "").trim();
      const sigCell = ""; // Signature column remains completely blank

      lines.push(
        [
          escapeCsv(srCell),
          escapeCsv(teamCell),
          escapeCsv(memberCell),
          escapeCsv(rollCell),
          escapeCsv(sigCell),
        ].join(",")
      );
    });
  });

  return lines.join("\r\n");
}

/**
 * Generates formatted XLSX with cell merges, borders, and printable styling matching Section 8
 */
export async function generateAttendanceXlsx(
  domainDisplayName: string,
  teams: RegistrationRecord[]
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Spark-A-Thon 2026 Organizer Administration";
  workbook.created = new Date();

  // Excel sheet name max 31 characters
  const safeSheetName = domainDisplayName.substring(0, 31).replace(/[\\/*?:[\]]/g, "_");
  const worksheet = workbook.addWorksheet(safeSheetName, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.6,
        bottom: 0.6,
        header: 0.3,
        footer: 0.3,
      },
    },
  });

  // Explicit column definitions and widths
  worksheet.columns = [
    { key: "srNo", width: 10 },
    { key: "teamName", width: 28 },
    { key: "memberName", width: 30 },
    { key: "rollNo", width: 18 },
    { key: "signature", width: 22 },
  ];

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
  };

  // ROW 1: Spark-A-Thon 2026
  worksheet.mergeCells("A1:E1");
  const row1 = worksheet.getCell("A1");
  row1.value = "Spark-A-Thon 2026";
  row1.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF000000" } };
  row1.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 32;
  for (let c = 1; c <= 5; c++) {
    worksheet.getRow(1).getCell(c).border = thinBorder;
  }

  // ROW 2: Domain Name
  worksheet.mergeCells("A2:E2");
  const row2 = worksheet.getCell("A2");
  row2.value = domainDisplayName;
  row2.font = { name: "Arial", size: 13, bold: true, color: { argb: "FF000000" } };
  row2.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 26;
  for (let c = 1; c <= 5; c++) {
    worksheet.getRow(2).getCell(c).border = thinBorder;
  }

  // ROW 3: Header Row
  const headerRow = worksheet.getRow(3);
  headerRow.height = 28;
  const headers = ["Sr.no.", "Team Name", "Team Members", "Roll No.", "Signature"];
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF000000" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" },
    };
    cell.border = thinBorder;
  });

  // DATA ROWS
  let currentRow = 4;

  if (teams.length === 0) {
    // Empty row placeholder
    worksheet.mergeCells("A4:E4");
    const emptyRow = worksheet.getRow(4);
    emptyRow.height = 24;
    const cell = emptyRow.getCell(1);
    cell.value = "No registered teams currently in this domain.";
    cell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF666666" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    for (let c = 1; c <= 5; c++) {
      emptyRow.getCell(c).border = thinBorder;
    }
  } else {
    teams.forEach((team, teamIndex) => {
      const srNo = teamIndex + 1;
      const members = getTeamMembersList(team);
      const startRow = currentRow;
      const endRow = currentRow + members.length - 1;

      members.forEach((member, memberIndex) => {
        const row = worksheet.getRow(currentRow);
        row.height = 22;

        // Column 1: Sr.no.
        if (memberIndex === 0) {
          row.getCell(1).value = srNo;
        }
        row.getCell(1).font = { name: "Arial", size: 10 };
        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(1).border = thinBorder;

        // Column 2: Team Name
        if (memberIndex === 0) {
          row.getCell(2).value = (team.team_name || "").trim();
        }
        row.getCell(2).font = { name: "Arial", size: 10, bold: true };
        row.getCell(2).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        row.getCell(2).border = thinBorder;

        // Column 3: Team Members
        row.getCell(3).value = (member.name || "").trim();
        row.getCell(3).font = { name: "Arial", size: 10 };
        row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(3).border = thinBorder;

        // Column 4: Roll No.
        row.getCell(4).value = (member.roll_no || "").trim();
        row.getCell(4).font = { name: "Arial", size: 10 };
        row.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(4).border = thinBorder;

        // Column 5: Signature (remains blank)
        row.getCell(5).value = "";
        row.getCell(5).border = thinBorder;

        currentRow++;
      });

      // Vertically merge Sr.no. and Team Name if team has multiple members
      if (members.length > 1) {
        worksheet.mergeCells(startRow, 1, endRow, 1);
        worksheet.mergeCells(startRow, 2, endRow, 2);
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Initiates a browser file download of a Blob
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
