import { executeAuditQueries, BatchQueryConfig } from '@pare-engine/query-engine';
import { analyzeSite } from '@pare-engine/site-crawler';
import { generateMiniAuditPDF } from '@pare-engine/report-generator';
import { 
    calculateOverallScore, 
    scoreAIVisibility, 
    scoreSchema, 
    scoreToGrade,
    AuditResult,
    DEFAULT_WEIGHTS
} from '@pare-engine/core';
import fs from 'fs';
import path from 'path';

async function runTestAudit() {
    console.log("🚀 Starting Test Audit...");

    const config: BatchQueryConfig = {
        businessName: "Albany Dental Care",
        domain: "https://albanydentaltest.com",
        vertical: "dental",
        location: "Albany, NY",
        competitors: ["Smile Center Albany", "Pearl Dentistry"],
        platforms: ["chatgpt", "perplexity"]
    };

    // 1. Crawl Site (Mocked)
    console.log("🕷️ Crawling site...");
    const siteAnalysis = await analyzeSite(config.domain);
    console.log(`   Found ${siteAnalysis.schemaAnalysis.length} pages`);

    // 2. Execute Queries (Mocked)
    console.log("🧠 Executing AI queries...");
    const queryResults = await executeAuditQueries(config);
    console.log(`   Received ${queryResults.length} responses`);

    // 3. Calculate Scores
    console.log("🧮 Calculating scores...");
    
    // Logic to bridge specific analysis to scores (simplified for test)
    const schemaScore = scoreSchema(
        siteAnalysis.schemaAnalysis.flatMap(p => p.schemaTypes),
        ['FAQPage'], // Mock missing
        [],
        'dental'
    );

    const aiScore = scoreAIVisibility(queryResults);
    
    // Construct full result object
    const auditResult: AuditResult = {
        overallScore: 0, // calc below
        letterGrade: 'F', // calc below
        aiVisibility: {
            score: aiScore,
            mentionRate: 0.2, // mock
            citationRate: 0.1, // mock
            avgPosition: 3.5, // mock
            platformScores: { chatgpt: 10, perplexity: 5, claude: 0, gemini: 0, google_aio: 0 }, // mock
            queryResults
        },
        schema: {
            score: schemaScore,
            presentTypes: siteAnalysis.schemaAnalysis.flatMap(p => p.schemaTypes),
            missingTypes: ['FAQPage', 'MedicalProcedure'],
            validationErrors: [],
            pageAnalysis: siteAnalysis.schemaAnalysis
        },
        content: {
            score: 12, // mock
            answerFirstPages: 1,
            faqPages: 0,
            avgStatsDensity: 2,
            authorAttributionPages: 0,
            pageAnalysis: siteAnalysis.contentAnalysis
        },
        technical: {
            score: 8, // mock
            robotsTxt: siteAnalysis.technical.robotsTxt,
            llmsTxt: siteAnalysis.technical.llmsTxt,
            llmsFullTxt: siteAnalysis.technical.llmsFullTxt,
            sitemapPresent: true,
            pageSpeed: 85,
            mobileFriendly: true,
            httpsEnabled: true
        },
        gbp: {
            score: 5, // mock
            rating: 4.2,
            reviewCount: 45,
            photoCount: 10,
            descriptionOptimized: false,
            categoryAccuracy: true,
            qAndAPresent: false,
            napConsistent: true
        }
    };

    auditResult.overallScore = calculateOverallScore(auditResult);
    auditResult.letterGrade = scoreToGrade(auditResult.overallScore);

    console.log(`   Overall Score: ${auditResult.overallScore} (${auditResult.letterGrade})`);

    // 4. Generate PDF
    console.log("📄 Generating PDF...");
    const pdfStream = await generateMiniAuditPDF(auditResult, config.businessName);
    
    const outputPath = path.join(process.cwd(), 'pare-engine', 'test-audit-output.pdf');
    const writeStream = fs.createWriteStream(outputPath);
    
    // @ts-ignore
    pdfStream.pipe(writeStream);

    writeStream.on('finish', () => {
        console.log(`✅ PDF generated successfully: ${outputPath}`);
    });
}

runTestAudit().catch(console.error);
