import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface GenerateTestPdfParams {
  result: any;
  test: any;
  questions: any[];
  subjectMap: Record<string, string>;
  userProfile?: {
    name?: string;
    fullName?: string;
    email?: string;
    username?: string;
  } | null;
}

export function generateTestPerformancePdf({
  result,
  test,
  questions,
  subjectMap,
  userProfile
}: GenerateTestPdfParams) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

    // Safe autoTable caller
    const callAutoTable = (options: any) => {
      if (typeof autoTable === 'function') {
        autoTable(doc, options);
      } else if (autoTable && typeof (autoTable as any).default === 'function') {
        (autoTable as any).default(doc, options);
      } else if (typeof (doc as any).autoTable === 'function') {
        (doc as any).autoTable(options);
      }
    };

    // Colors
    const primaryColor: [number, number, number] = [0, 110, 93]; // #006e5d Teal
    const darkSlate: [number, number, number] = [15, 23, 42]; // #0f172a
    const mutedSlate: [number, number, number] = [100, 116, 139]; // #64748b
    const greenAccent: [number, number, number] = [22, 163, 74]; // #16a34a
    const redAccent: [number, number, number] = [220, 38, 38]; // #dc2626
    const bgLight: [number, number, number] = [248, 250, 252]; // #f8fafc

    // 1. Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 38, 'F');

    // Decorative accent bar
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 36, pageWidth, 2, 'F');

    // Title: PrepNext
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('PrepNext', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(204, 251, 241); // Teal 100
    doc.text('NATIONAL EXAM PREPARATION & MOCK TEST ENGINE', 14, 26);

    // Right-aligned report label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('PERFORMANCE SCORECARD', pageWidth - 14, 18, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(204, 251, 241);
    const reportDate = result.createdAt
      ? new Date(result.createdAt).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
    doc.text(`Generated: ${reportDate}`, pageWidth - 14, 26, { align: 'right' });

    // 2. Candidate & Test Information Card
    let currentY = 46;
    doc.setFillColor(...bgLight);
    doc.roundedRect(14, currentY, pageWidth - 28, 32, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY, pageWidth - 28, 32, 2, 2, 'S');

    // Column 1: Candidate Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...mutedSlate);
    doc.text('CANDIDATE NAME', 20, currentY + 8);
    doc.setFontSize(10.5);
    doc.setTextColor(...darkSlate);
    const studentName =
      userProfile?.fullName ||
      userProfile?.name ||
      result.userName ||
      userProfile?.username ||
      'Aspirant Candidate';
    doc.text(studentName, 20, currentY + 14);

    doc.setFontSize(8);
    doc.setTextColor(...mutedSlate);
    doc.text('EMAIL / ID', 20, currentY + 22);
    doc.setFontSize(9);
    doc.setTextColor(...darkSlate);
    doc.text(userProfile?.email || result.userEmail || result.userId || 'N/A', 20, currentY + 27);

    // Column 2: Test Info
    const col2X = 110;
    doc.setFontSize(8);
    doc.setTextColor(...mutedSlate);
    doc.text('TEST PAPER', col2X, currentY + 8);
    doc.setFontSize(10.5);
    doc.setTextColor(...darkSlate);
    const testTitle = test?.title || result.testTitle || 'Mock Examination';
    // Truncate if too long
    const truncatedTitle = testTitle.length > 42 ? testTitle.substring(0, 39) + '...' : testTitle;
    doc.text(truncatedTitle, col2X, currentY + 14);

    doc.setFontSize(8);
    doc.setTextColor(...mutedSlate);
    doc.text('ATTEMPT DETAILS', col2X, currentY + 22);
    doc.setFontSize(9);
    doc.setTextColor(...darkSlate);
    const attemptStr = `Attempt #${result.attemptNumber || 1} • Total Questions: ${result.totalQuestions || questions.length || 0}`;
    doc.text(attemptStr, col2X, currentY + 27);

    currentY += 40;

    // 3. Executive Metrics Highlights (4 Summary Blocks)
    const marksObtained = result.obtainedMarks !== undefined ? result.obtainedMarks : result.score;
    const maxMarks = result.maxMarks || test?.totalMarks || 100;
    const totalQ = result.totalQuestions || questions.length || 0;
    const correctQ = result.correctCount || 0;
    
    // Calculate unattempted vs incorrect
    const answers = result.answers || [];
    let unattemptedQ = 0;
    if (answers.length > 0) {
      unattemptedQ = answers.filter((a: any) => a.notAttempted || !a.selected).length;
    }
    const incorrectQ = Math.max(0, totalQ - correctQ - unattemptedQ);
    const accuracyPercent = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

    const blockWidth = (pageWidth - 28 - 9) / 4; // 4 blocks with 3mm gap
    const blockHeight = 22;

    const metrics = [
      {
        label: 'SCORE / MARKS',
        value: `${Math.round(marksObtained * 10) / 10}/${maxMarks}`,
        color: primaryColor,
        sub: `${Math.round((marksObtained / (maxMarks || 1)) * 100)}% of Max Marks`
      },
      {
        label: 'ACCURACY',
        value: `${accuracyPercent}%`,
        color: accuracyPercent >= 70 ? greenAccent : primaryColor,
        sub: accuracyPercent >= 70 ? 'Excellent Pace' : 'Target: 80%+'
      },
      {
        label: 'CORRECT ANSWERS',
        value: `${correctQ}`,
        color: greenAccent,
        sub: `${totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0}% of Total`
      },
      {
        label: 'INCORRECT / SKIPPED',
        value: `${incorrectQ} / ${unattemptedQ}`,
        color: incorrectQ > 0 ? redAccent : mutedSlate,
        sub: `${incorrectQ} Wrong • ${unattemptedQ} Blank`
      }
    ];

    metrics.forEach((m, idx) => {
      const bx = 14 + idx * (blockWidth + 3);
      doc.setFillColor(...bgLight);
      doc.roundedRect(bx, currentY, blockWidth, blockHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(bx, currentY, blockWidth, blockHeight, 1.5, 1.5, 'S');

      // Top colored indicator line
      doc.setFillColor(...m.color);
      doc.rect(bx, currentY, blockWidth, 1.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...mutedSlate);
      doc.text(m.label, bx + 4, currentY + 6.5);

      doc.setFontSize(12);
      doc.setTextColor(...m.color);
      doc.text(m.value, bx + 4, currentY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...mutedSlate);
      doc.text(m.sub, bx + 4, currentY + 19);
    });

    currentY += blockHeight + 8;

    // 4. Subject Performance Breakdown Table (if available)
    if (result.subjectStats && Object.keys(result.subjectStats).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      doc.text('Subject-wise Performance Breakdown', 14, currentY + 4);

      const subjectRows = Object.entries<any>(result.subjectStats)
        .filter(([subjId]) => subjId !== 'general')
        .map(([subjId, stats]) => {
          const subjName = subjectMap[subjId] || 'General Subject';
          const subjAccuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
          const status = subjAccuracy >= 75 ? 'Strong' : subjAccuracy >= 50 ? 'Moderate' : 'Needs Focus';
          return [
            subjName,
            String(stats.total || 0),
            String(stats.correct || 0),
            String((stats.total || 0) - (stats.correct || 0)),
            `${Math.round((stats.score || 0) * 10) / 10} / ${stats.maxScore || 0}`,
            `${subjAccuracy}%`,
            status
          ];
        });

      if (subjectRows.length > 0) {
        callAutoTable({
          startY: currentY + 7,
          head: [['Subject / Section', 'Total Qs', 'Correct', 'Incorrect', 'Marks', 'Accuracy', 'Status']],
          body: subjectRows,
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 2.5
          },
          bodyStyles: {
            fontSize: 7.5,
            textColor: darkSlate,
            cellPadding: 2
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 18, halign: 'center' },
            2: { cellWidth: 18, halign: 'center', textColor: greenAccent },
            3: { cellWidth: 20, halign: 'center', textColor: redAccent },
            4: { cellWidth: 24, halign: 'center' },
            5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
            6: { cellWidth: 28, halign: 'center' }
          },
          margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 30;
      }
    }

    // 5. Question & Answer Review Table
    if (questions && questions.length > 0) {
      // Check if we need to advance to next section or add title
      if (currentY > pageHeight - 45) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      doc.text('Detailed Question Review & Explanations', 14, currentY + 4);

      const questionRows = questions.map((q, idx) => {
        const resAns = result.answers?.find((a: any) => a.questionId === q.id);
        const isCorrect = resAns?.isCorrect;
        const isNotAttempted = resAns?.notAttempted || !resAns?.selected;
        
        let status = 'Unattempted';
        if (isCorrect) status = 'Correct (+1)';
        else if (!isNotAttempted) status = 'Incorrect (-0.25)';

        const qText = q.question ? q.question.replace(/\n+/g, ' ').trim() : `Question ${idx + 1}`;
        const userAns = resAns?.selected ? String(resAns.selected).trim() : 'Skipped / Blank';
        const correctAns = q.correctAnswer ? String(q.correctAnswer).trim() : 'N/A';
        const explanation = q.explanation ? q.explanation.replace(/\n+/g, ' ').trim() : '-';

        return [
          `#${idx + 1}`,
          qText,
          userAns,
          correctAns,
          status,
          explanation
        ];
      });

      callAutoTable({
        startY: currentY + 7,
        head: [['Q#', 'Question Statement', 'Your Answer', 'Correct Answer', 'Result', 'Explanation']],
        body: questionRows,
        theme: 'grid',
        headStyles: {
          fillColor: darkSlate,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          cellPadding: 2.5
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [51, 65, 85],
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 52 },
          2: { cellWidth: 26 },
          3: { cellWidth: 26, fontStyle: 'bold', textColor: greenAccent },
          4: { cellWidth: 24, halign: 'center' },
          5: { cellWidth: 44 }
        },
        didParseCell: (data: any) => {
          // Highlight result column
          if (data.section === 'body' && data.column.index === 4) {
            const cellVal = String(data.cell.raw);
            if (cellVal.includes('Correct')) {
              data.cell.styles.textColor = greenAccent;
              data.cell.styles.fontStyle = 'bold';
            } else if (cellVal.includes('Incorrect')) {
              data.cell.styles.textColor = redAccent;
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = mutedSlate;
            }
          }
        },
        margin: { left: 14, right: 14, bottom: 18 }
      });
    }

    // 6. Page Numbers & Footer on All Pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedSlate);
      doc.text(
        'PrepNext EdTech • Official Candidate Mock Test Report • Confidential',
        14,
        pageHeight - 7
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
    }

    // Save and Trigger Download
    const cleanTestTitle = (test?.title || result.testTitle || 'Mock_Test')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const fileName = `PrepNext_Scorecard_${cleanTestTitle}_${Date.now()}.pdf`;
    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('Failed to generate test summary PDF:', error);
    throw error;
  }
}
