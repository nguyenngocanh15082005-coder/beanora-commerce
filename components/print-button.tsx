"use client";
import { Printer } from "lucide-react";
export function PrintButton() { return <button className="button button-outline" onClick={() => window.print()}><Printer size={15} />In hóa đơn</button>; }
