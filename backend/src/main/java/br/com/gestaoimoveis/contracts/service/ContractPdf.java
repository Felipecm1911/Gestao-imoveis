package br.com.gestaoimoveis.contracts.service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.openpdf.text.Document;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.FontFactory;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.Phrase;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;

import br.com.gestaoimoveis.contracts.api.ContractDtos.ContractResponse;

/**
 * PDF de resumo do contrato: partes, imóvel, condições e linhas de assinatura.
 * shortcut: não é a minuta jurídica completa (cláusulas), só o quadro-resumo; trocar por modelo de cláusulas quando houver um aprovado.
 */
final class ContractPdf {

    private static final Locale BR = Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
    private static final Font LABEL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    private static final Font TEXT = FontFactory.getFont(FontFactory.HELVETICA, 10);

    private ContractPdf() {}

    static byte[] render(ContractResponse c, String organizationName) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 56, 56, 56, 56);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Paragraph title = new Paragraph("Contrato de locação " + c.code(), TITLE);
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);
        Paragraph org = new Paragraph(organizationName, TEXT);
        org.setAlignment(Element.ALIGN_CENTER);
        org.setSpacingAfter(18);
        doc.add(org);

        PdfPTable t = new PdfPTable(new float[] {1, 3});
        t.setWidthPercentage(100);
        row(t, "Locador", c.owner().name());
        row(t, "Locatário", c.tenant().name() + " – CPF/CNPJ " + c.tenant().document());
        row(t, "Imóvel", c.property().code() + " – " + c.property().title());
        row(t, "Endereço", c.property().address());
        row(t, "Vigência", date(c.startDate()) + " a " + date(c.endDate()));
        row(t, "Aluguel mensal", money(c.monthlyRent()));
        row(t, "Vencimento", "Dia " + c.dueDay() + " do mês seguinte ao de referência");
        row(t, "Reajuste", switch (c.adjustmentIndex()) {
            case NENHUM -> "Sem reajuste previsto";
            case IGPM -> "IGP-M, anual";
            case IPCA -> "IPCA, anual";
            case PERCENTUAL_FIXO -> c.adjustmentPercent().toPlainString().replace('.', ',') + "% ao ano";
        });
        row(t, "Garantia", switch (c.guaranteeType()) {
            case NENHUMA -> "Sem garantia";
            case CAUCAO -> "Caução";
            case FIADOR -> "Fiador";
            case SEGURO_FIANCA -> "Seguro-fiança";
            case TITULO_CAPITALIZACAO -> "Título de capitalização";
        } + (c.guaranteeValue() == null ? "" : " – " + money(c.guaranteeValue()))
                + (c.guaranteeNotes() == null ? "" : " – " + c.guaranteeNotes()));
        if (c.notes() != null) row(t, "Observações", c.notes());
        doc.add(t);

        PdfPTable sign = new PdfPTable(2);
        sign.setWidthPercentage(100);
        sign.setSpacingBefore(72);
        sign.addCell(signature("Locador: " + c.owner().name()));
        sign.addCell(signature("Locatário: " + c.tenant().name()));
        doc.add(sign);

        doc.close();
        return out.toByteArray();
    }

    private static void row(PdfPTable t, String label, String value) {
        t.addCell(cell(new Phrase(label, LABEL)));
        t.addCell(cell(new Phrase(value, TEXT)));
    }

    private static PdfPCell cell(Phrase p) {
        PdfPCell cell = new PdfPCell(p);
        cell.setPadding(6);
        return cell;
    }

    private static PdfPCell signature(String who) {
        PdfPCell cell = new PdfPCell(new Phrase("______________________________\n" + who, TEXT));
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private static String date(LocalDate d) {
        return d.format(DATE);
    }

    private static String money(BigDecimal v) {
        return NumberFormat.getCurrencyInstance(BR).format(v);
    }
}
