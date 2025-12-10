import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Cliente, Contrato, Pagamento } from '../types';
import { format } from 'date-fns';

interface ReportData {
  cliente: Cliente;
  contratos: Contrato[];
  pagamentos: Pagamento[];
}

export const generateClientReport = (data: ReportData) => {
  const doc = new jsPDF();
  const { cliente, contratos, pagamentos } = data;

  // Header
  doc.setFillColor(33, 150, 243);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('CP Acessoria e Cobrança', 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Relatório de Cliente', 105, 23, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Client Information
  let yPos = 40;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Cliente', 14, yPos);
  
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const clientInfo = [
    ['Nome:', cliente.nome],
    ['Registro:', cliente.registro],
    ['Telefone:', cliente.telefone],
    ['Endereço:', cliente.endereco],
    ['Banco:', cliente.banco],
    ['Dia Vencimento:', cliente.data_vencimento || '-'],
  ];

  clientInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 50, yPos);
    yPos += 7;
  });

  // Financial Summary
  yPos += 5;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Financeiro', 14, yPos);
  yPos += 10;

  const contratoIds = contratos.map((c) => c.contrato_id);
  const totalPago = pagamentos
    .filter((p) => contratoIds.includes(p.contrato_id) && (p.status === 'PAGO' || p.status === 'PAGO_COM_ATRASO'))
    .reduce((sum, p) => sum + p.valor, 0);
  
  const totalAtrasado = pagamentos
    .filter((p) => contratoIds.includes(p.contrato_id) && p.status === 'ATRASADO')
    .reduce((sum, p) => sum + p.valor, 0);
  
  const totalAberto = pagamentos
    .filter((p) => contratoIds.includes(p.contrato_id) && (p.status === 'EM_ABERTO' || p.status === 'ABERTO' as any))
    .reduce((sum, p) => sum + p.valor, 0);

  const totalGeral = totalPago + totalAtrasado + totalAberto;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Contratos: ${contratos.length}`, 14, yPos);
  yPos += 7;
  doc.text(`Valor Total dos Contratos: R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos);
  yPos += 7;
  doc.setTextColor(34, 197, 94);
  doc.text(`Total Pago: R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos);
  yPos += 7;
  doc.setTextColor(239, 68, 68);
  doc.text(`Total Atrasado: R$ ${totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos);
  yPos += 7;
  doc.setTextColor(59, 130, 246);
  doc.text(`Total a Vencer: R$ ${totalAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, yPos);
  
  doc.setTextColor(0, 0, 0);

  // Contracts Table
  if (contratos.length > 0) {
    yPos += 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Contratos', 14, yPos);
    yPos += 5;

    const contractRows = contratos.map((c) => [
      `#${c.contrato_id}`,
      c.nome_contratante,
      c.cpf_contratante,
      format(new Date(c.data), 'dd/MM/yyyy'),
      c.duracao_em_meses.toString(),
      `R$ ${c.valor_contrato.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['ID', 'Contratante', 'CPF', 'Data', 'Duração', 'Valor']],
      body: contractRows,
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243] },
      styles: { fontSize: 9 },
      columnStyles: {
        5: { halign: 'right' },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Payments Table
  if (pagamentos.length > 0 && yPos < 250) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico de Pagamentos', 14, yPos);
    yPos += 5;

    const getStatusText = (status: string) => {
      switch (status) {
        case 'PAGO': return 'Pago';
        case 'PAGO_COM_ATRASO': return 'Pago c/ Atraso';
        case 'ATRASADO': return 'Atrasado';
        case 'EM_ABERTO': return 'Aberto';
        case 'ABERTO': return 'Aberto'; // Legacy support
        default: return status;
      }
    };

    const paymentRows = pagamentos
      .sort((a, b) => a.contrato_id - b.contrato_id || a.numero_parcela - b.numero_parcela)
      .map((p) => [
        `#${p.contrato_id}`,
        `Parcela ${p.numero_parcela}`,
        format(new Date(p.data_vencimento), 'dd/MM/yyyy'),
        p.data_pagamento ? format(new Date(p.data_pagamento), 'dd/MM/yyyy') : '-',
        `R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        getStatusText(p.status),
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Contrato', 'Parcela', 'Vencimento', 'Pagamento', 'Valor', 'Status']],
      body: paymentRows,
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243] },
      styles: { fontSize: 8 },
      columnStyles: {
        4: { halign: 'right' },
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Página ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `relatorio_${cliente.nome.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};
