/**
 * Seed script: inserts Tracells epics and tasks into the Supabase tasks board.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
 *   node scripts/seed_tasks.js
 *
 * The service role key bypasses RLS and lets us insert as any user.
 * Get it from: Supabase dashboard → Project Settings → API → service_role (secret).
 */

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OWNER_EMAIL = 'danielbrown13@gmail.com'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
  process.exit(1)
}

const HEADERS = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function rest(method, path, body) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, { method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

/** Colors assigned to each epic. */
const EPIC_COLORS = {
  'Infrastructure & AWS': '#f97316',
  'LabGuru & Molecular Data': '#0d9488',
  'Reporting': '#8b5cf6',
  'Pipeline & Bioinformatics': '#3b82f6',
  'REDCap & Clinical Data': '#ef4444',
  'Database Visualization': '#10b981',
}

/**
 * All tasks to seed.
 * description = short summary; explanation = full detail.
 * Combined into the tasks.description column as "summary\n\nexplanation".
 * labels: used to preserve 'on-hold' status (schema has no on_hold enum value).
 */
const TASKS = [
  {
    title: 'REDCap Automated Data Fetching from AWS',
    description: 'Enable automated daily REDCap API pull from Soroka and Schneider running on AWS',
    explanation: 'Private API tokens work but AWS IP (3.148.154.119) is blocked by Imperva Incapsula on redcap.clalit.co.il. Waiting for Ruthi in Clalit to add the IP to the allowlist. Blocks bi-weekly report automation and the 24h refresh cycle. Incapsula incident ref: 120000660069370761-735246689.',
    priority: 'high',
    epic: 'Infrastructure & AWS',
    status: 'blocked',
    labels: [],
  },
  {
    title: 'LabGuru API Token - Long-Term Robust Solution',
    description: "Replace Tamar's personal LabGuru token (30-day expiry) with a durable automated auth approach",
    explanation: "Current data fetching Lambda uses Tamar's personal token which expires monthly. Options per LabGuru support: (a) contact LabGuru chat for a longer-lived token, (b) use session endpoint with username+password (password rotates annually). Credentials: tamarj@tracells.com / Nimi050592@&.",
    priority: 'medium',
    epic: 'LabGuru & Molecular Data',
    status: 'in_progress',
    labels: [],
  },
  {
    title: 'REDCap Bi-Weekly Report - Automate Sending',
    description: 'Automate delivery of bi-weekly HTML reports to Soroka/Meir/Schneider research coordinators',
    explanation: 'Report generation exists but sending is manual. Blocked on AWS IP allowlist (REDCap automated pull must work first). Once unblocked: set up email sending. Also requires format redesign per coordinator report ticket.',
    priority: 'medium',
    epic: 'Reporting',
    status: 'blocked',
    labels: [],
  },
  {
    title: 'Coordinator Bi-Weekly Reports - Redesign Format',
    description: 'Redesign the coordinator report format to meet new spec from the 12 Apr 2026 review',
    explanation: 'New requirements: (1) 3 separate reports — one per institute (Schneider, Soroka, Meir); (2) keep title and stats header; (3) include only Per-Record Detail section; (4) show only issues per patient — remove parsed data and DB view sections; (5) use original REDCap field names instead of parsed field names; (6) remove Check column from error/warning tables; (7) replace temporal gap rules with coordinator-facing language matching the instructions given to coordinators (IBD: stool 1-7 days before endo; Polyp stool_1: ≥28d after polyp_screen and 1-7d before endo_lower; Polyp stool_2: 28-56d after endo_lower; TNF: only stool_collection_1 rules apply).',
    priority: 'high',
    epic: 'Reporting',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline Automations and AWS Triggering Setup',
    description: "Replace manual pipeline triggering from Tamar's PC with automated/semi-automated AWS trigger",
    explanation: "Pipeline is currently triggered manually from Tamar's PC or an AWS instance. Next steps: (1) check what Ron already configured in the Nf-rnaseq-pipeline repo and AWS (SQS?); (2) implement auto-trigger — candidate: fire when LabGuru experiment has 'Move to sequencing = Y', even before protocol is signed.",
    priority: 'high',
    epic: 'Infrastructure & AWS',
    status: 'not_started',
    labels: [],
  },
  {
    title: "Tamar's Pipeline Tables - Expand Schema and Load to DB",
    description: "Complete schema expansion for all pipeline output tables per Tamar's review and populate DB",
    explanation: 'Pipeline tables are derived from JSON/TXT tool reports (STAR, HTSeq, Kraken/Bracken, FastQC, Cutadapt, UMI-tools). Schema review is in progress. Once schema is approved, fill tables from existing run outputs (runs 008 010 011 012 016 and run 14 which Tamar uploaded to Drive).',
    priority: 'high',
    epic: 'Pipeline & Bioinformatics',
    status: 'in_progress',
    labels: [],
  },
  {
    title: 'Pipeline DB - Split Demux Results into Two Tables',
    description: 'Separate the current demux_results table into bcl2fastq (pool demux) and fastq_multx (sample demux)',
    explanation: 'bcl2fastq table fields: pool_id, i5_seq, i7_seq, fastq_id_r1, fastq_id_r2, pool_reads_output, reads_input_total, reads_undetermined, pct_of_input. fastq_multx table fields: pool_id, sprint_sample_id, sample_name, sample_barcode_seq, fastq_id_r1, fastq_id_r2, sample_reads_output, pool_reads_input_total, pct_of_input. Open question: confirm fastq_id vs path approach for fastq_id_r1/r2.',
    priority: 'medium',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - General QC Parameters Table',
    description: 'Create a general QC metrics table capturing FastQC output across 3 pipeline stages (pool demux, sample demux, trimming)',
    explanation: 'Fields: fastq_id, pool_number (stage 1 only), sprint_sample_id (stages 2-3), sample_name (stages 2-3), sprint_id, ngs_run_id, qc_stage (1/2/3), read_direction (r1/r2), file_path, total_reads, mean/median/min/max read lengths, reads/pct by quality band (q≤20, q20-28, q≥28), pct_q30, gc_percent, n_percent, duplication_rate_percent, estimated unique/duplicated reads, adapter_content_max_percent, overrepresented_total_percent, FastQC module pass/warn/fail flags for: basic_stats, per_base_quality, per_sequence_quality, sequence_length_dist, duplication_levels, overrepresented_sequences, adapter_content.',
    priority: 'medium',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - run_info Table',
    description: 'Create run_info table with per-NGS-run metadata extracted from S3 run logs',
    explanation: 'Fields: ngs_run_id, run_path (s3://s3-784303385254-pipeline/0_FT/runs/*), ngs_date, instrument_id (from bcl folder), flowcell_id (from bcl folder), run_params_path, r1_cycles, r2_cycles, i1_cycles, i2_cycles (all from read_lengths_*.json in run_logs), PF reads, Pct_index_pf ((PF reads assigned to samples / total PF reads)*100), clusters_PF.',
    priority: 'medium',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - run_path Table',
    description: 'Create run_path table storing all pipeline directory paths from the run parameters JSON',
    explanation: 'Extract all params_* path fields from run_{n}_parameters*.json (source: s3://…/runs/14/2_finals/run_logs/). Includes paths for all pipeline stages: bcl root, sample sheet, demux dirs, QC dirs (pool and sample FastQC/MultiQC), UMI extract, trimming (cutadapt output/log/report/json/info), filtering, Kraken, STAR, dedup, counting, final output, ngsplot.',
    priority: 'low',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - run_parameters Table',
    description: 'Create run_parameters table with all pipeline configuration parameters from the run parameters JSON',
    explanation: '~70+ fields including: timestamp, profile, ngs_run_id, publish_mode, thread/CPU/memory settings for each tool (bcl2fastq, FastQC, MultiQC, fastq_multx, UMI-tools, Cutadapt, STAR, samtools, HTSeq, ngsplot), barcode/UMI params, trim settings (poly_a_len, trim_rounds, cut_start, qvalue_cutoff_3end, read_min_len), Kraken DB params, genome/gencode version, alignment settings.',
    priority: 'low',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - Software Versions Table',
    description: 'Create versions table tracking tool versions used in each pipeline run',
    explanation: 'Fields: ngs_run_id, tool_name, version. Sources: (1) software_version_*.yml in run_logs for per-step tool versions; (2) nextflow_version (TBD — may need to be added to logs); (3) genome_build and gencode_version from run parameters JSON; (4) git version (not sure if available yet — flag if not).',
    priority: 'medium',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - cutadapt_qc Table (rename + new fields)',
    description: 'Rename cutadapt_results to cutadapt_qc and add comprehensive adapter trimming stats',
    explanation: 'New fields to add: reads_discarded_total, reads_too_short, pct_reads_retained, mean_len_in, mean_len_out, bases_quality_trimmed, bases_adapter_trimmed_total, reads_with_any_adapter, pct_reads_with_any_adapter, adapters_detected_n, dominant_adapter_name, dominant_adapter_pct. Existing fields: sprint_sample_id, sample_name, sprint_id, ngs_run_id, reads_input, reads_output.',
    priority: 'medium',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - qc_cutadapt_adapter Table',
    description: 'Create new per-adapter breakdown table for cutadapt results (2 adapters per config)',
    explanation: 'Fields: sprint_sample_id, sample_name, sprint_id, ngs_run_id, adapter_name (or sequence), reads_with_adapter, pct_reads_with_adapter, bases_trimmed, mean_bases_trimmed_per_hit. One row per adapter per sample.',
    priority: 'medium',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - kraken_results Table',
    description: 'Create kraken_results table with per-sample host/pathogen classification summary from Kraken output',
    explanation: 'Fields: sprint_sample_id, sample_name, sprint_id, ngs_run_id, total_reads, classified_reads, classified_pct, unclassified_reads, unclassified_pct, human_reads, human_pct, bacterial_reads, bacterial_pct, viral_reads, viral_pct, fungal_reads, fungal_pct.',
    priority: 'medium',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - STAR_alignment_qc Table',
    description: 'Create STAR_alignment_qc table with per-sample mapping statistics from STAR logs',
    explanation: 'Fields: sprint_sample_id, sample_name, sprint_id, ngs_run_id, input_reads, mapped_reads, mapped_pct, uniquely_mapped, unique_pct, multi_mapped, multi_pct, unmapped_reads, unmapped_pct, unmapped_too_short_pct, unmapped_too_many_mismatches_pct, unmapped_too_many_loci_pct, avg_mapped_len, mismatch_pct, insertion_pct, deletion_pct, splices_total, splices_annotated, splices_annotated_pct, chimeric_reads, chimeric_pct.',
    priority: 'medium',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - umi_dedup Table',
    description: 'Create umi_dedup table with UMI deduplication statistics per sample',
    explanation: 'Fields: sprint_sample_id, sample_name, sprint_id, ngs_run_id, reads_before_dedup, reads_after_dedup, reads_removed_by_dedup, dedup_rate_pct, reads_retained_pct, unique_umi_count, positions_deduped, mean_umis_per_pos, median_umis_per_pos, max_umis_per_pos, mean_reads_per_umi.',
    priority: 'medium',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - htseq_count Table',
    description: 'Create htseq_count table with gene-level counting statistics per sample from HTSeq',
    explanation: 'Fields: sprint_sample_id, sample_name, sprint_id, ngs_run_id, total_input_reads, reads_assigned, reads_assigned_pct, assignment_rate_pct, no_feature, no_feature_pct, ambiguous, ambiguous_pct, too_low_quality, too_low_quality_pct, not_aligned, not_aligned_pct, not_unique, not_unique_pct. Also: matrix_genes (gene count from count matrix), reads_per_gene_mean.',
    priority: 'medium',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Pipeline DB - overrepresented_sequences Table',
    description: 'Create overrepresented_sequences table storing top overrepresented sequences from FastQC across 3 pipeline stages',
    explanation: 'Fields: fastq_id, pool_number/sprint_sample_id/sample_name (stage-dependent), sprint_id, ngs_run_id, rank, sequence, count, percent, possible_source. Data from fastqc_data.txt. Currently on hold — implement after QC parameters table is stable.',
    priority: 'low',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: ['on-hold'],
  },
  {
    title: 'Pipeline DB - qc_bracken_summary Table',
    description: 'Create qc_bracken_summary table with Bracken species-level classification results per sample',
    explanation: 'Fields: sprint_sample_id, sample_name, sprint_id, ngs_run_id, input/classified reads, bracken_reads_assigned/pct, n_taxa_reported, n_taxa_above_threshold, top-10 taxa details (name/taxid/reads/pct_total/pct_classified for taxa 1-10), specific pathogen rows for: Salmonella enterica, Shigella dysenteriae, Campylobacter jejuni, Clostridioides difficile, Giardia lamblia. Source: bracken_reports/ in s3. On hold — discuss best schema for top-N taxa storage.',
    priority: 'low',
    epic: 'Pipeline & Bioinformatics',
    status: 'not_started',
    labels: ['on-hold'],
  },
  {
    title: 'LabGuru Delivery Validation System',
    description: 'Build end-to-end system that validates clinical data of newly delivered samples against LabGuru and REDCap',
    explanation: "When a new delivery arrives: (1) fetch Sample delivery table from LabGuru protocol #22; (2) compare fields with clinical data in DB (sample name, stool collection date, visit number, arm/project, study group, procedure type, colonoscopy date, EGD date); (3) check DB-only fields (mayo_score for UC, ses_cd_score for CD, polyp_number and max_polyp_size for polyp cohort); (4) validate stool collection dates per project-specific rules (IBD/Polyp stool_1/Polyp stool_2/TNF); (5) generate HTML report for lab staff showing valid/invalid fields with values from both sources; (6) send report to lab team. Field mapping spec is defined in the Apr 12 2026 notes.",
    priority: 'medium',
    epic: 'LabGuru & Molecular Data',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'DB Fix - EGD Fields False Instead of Null (Soroka)',
    description: 'Fix DB so patients with no EGD data show NULL instead of False for EGD fields',
    explanation: 'For Soroka patients with no EGD info, fields such as egd_ulceration, egd_erosions, egd_polyps, egd_inflammation are currently stored as False in DB. They should be NULL. Likely a parsing issue where missing values are defaulted to False. Example visible in DB view (egd_findings domain).',
    priority: 'low',
    epic: 'REDCap & Clinical Data',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'DB Fix - ibd_surgeries Surgery Type Fields Null (Soroka)',
    description: 'Fix parsing so surgery_type sub-fields populate correctly when ibd_surgery=True',
    explanation: 'In ibd_surgeries table: when surgery=True all surgery type fields are null in DB, but REDCap has data (e.g. patient 01-231: Gastrointestinal Surgery=Yes, type=Cholecystectomy, date=15/12/2022). Parser is not extracting the surgery description sub-fields.',
    priority: 'medium',
    epic: 'REDCap & Clinical Data',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'DB Fix - uc_disease_extent False Positive Error When No Active Inflammation',
    description: 'Update validation rule so uc_disease_extent all-zero case is not an error when colonoscopy shows no active inflammation',
    explanation: 'Current rule: (diagnosis_uc==1 | diagnosis_ibdu==1) & colonoscopy_active_inflammation==1 → uc_disease_extent_e* != NaN & sum==1. When colonoscopy_active_inflammation=0, sum(uc_disease_extent_e*) can legitimately be 0 — no error should be raised. Examples: patients 01-049, 01-059.',
    priority: 'medium',
    epic: 'REDCap & Clinical Data',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'LabGuru DB - Fix SprintInfo Name Field for Sprint_012',
    description: "Investigate and fix incorrect 'name' field values in SprintInfo for Sprint_012",
    explanation: "Sprint_012 shows wrong data in the 'name' column for some rows (e.g. row 33 in viewer, corresponding to sample 66 in LabGuru, shows 'May Rokach' instead of sample name). Determine if this is a parser issue or a LabGuru source data issue with Sprint_012's non-standard form structure.",
    priority: 'low',
    epic: 'LabGuru & Molecular Data',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'LabGuru DB - Fix SCRB sprint_id and Barcode Fields',
    description: 'Fix SCRB table: sprint_id is empty and sample_barcode_well/seq fields are not populated',
    explanation: "sprint_id should come from the 'Reverse transcription' form's Sprint ID field. sample_barcode_well and sample_barcode_seq should be taken from the 'Sample-Barcode pairings' form element, paired to samples using the 'Sample unique ID' field in the same form.",
    priority: 'medium',
    epic: 'LabGuru & Molecular Data',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'LabGuru DB - Fix Nextera Table Duplicate Rows',
    description: 'Fix Nextera table: eliminate duplicate rows and use the correct LabGuru element mapping',
    explanation: "Duplicates arise from pulling from two overlapping LabGuru tables. Fix by using explicit field-to-element mapping: unique_dual_index/set/i7_seq/i5_seq/ts_size_bp/pct_library_200_1000/moved_to_lq_by_ts from 'Unique dual index' dataset; pool_conc_adj_in_lq/moved_to_final_batches/move_to_sequencing from 'LQ information'. Also: nextera_date from experiment start_date; nextera_done_by from experiment owner member name.",
    priority: 'medium',
    epic: 'LabGuru & Molecular Data',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Database Visualization Layer',
    description: 'Build a visualization layer on top of the DB, initially focused on REDCap/clinical data',
    explanation: 'Bonus component. Visualize data from the database. Initial scope: REDCap clinical data only. Designed to support additional data sources (LabGuru molecular, pipeline) in the future. No tool or implementation spec defined yet — needs design discussion.',
    priority: 'low',
    epic: 'Database Visualization',
    status: 'not_started',
    labels: [],
  },
  {
    title: 'Open Question: colonoscopy_active_inflammation with SES-CD 0-2',
    description: 'Clarify with Dror whether active inflammation can be coded with SES-CD 0-2 and what the correct validation rule should be',
    explanation: 'Dori flagged this as a question for Dror. Examples in Soroka: patients 02-069, 01-064. Currently highlighted as requiring clarification before the rule can be finalized. May impact validation tier B rules.',
    priority: 'low',
    epic: 'REDCap & Clinical Data',
    status: 'not_started',
    labels: ['question'],
  },
  {
    title: 'Open Question: TNF Timepoint Rule for Baseline vs Week_0',
    description: 'Clarify the tnf_timepoint rule for baseline records in the TNF project (Schneider)',
    explanation: 'Error raised: project != TNF → tnf_timepoint == NaN | actual: project=tnf, tnf_timepoint=0. This fires for baseline + week_0. For week_0, tnf_timepoint=0 is correct. For ibd_baseline rows, tnf_timepoint should be Null (per earlier rule). Needs confirmation from Tamar on whether the rule has been correctly updated or if a separate handling is needed for baseline vs week_0.',
    priority: 'low',
    epic: 'REDCap & Clinical Data',
    status: 'not_started',
    labels: ['question'],
  },
]

async function main() {
  // Resolve the owner user ID from the profiles table.
  const profiles = await rest('GET', `profiles?email=eq.${encodeURIComponent(OWNER_EMAIL)}&select=id`)
  if (!profiles?.length) {
    console.error('Could not find profile for', OWNER_EMAIL)
    process.exit(1)
  }
  const userId = profiles[0].id
  console.log(`Owner user ID: ${userId}`)

  // Create epics (skip if title already exists).
  const existingEpics = await rest('GET', 'epics?select=id,title')
  const existingTitles = new Set((existingEpics ?? []).map((e) => e.title))
  const epicMap = Object.fromEntries((existingEpics ?? []).map((e) => [e.title, e.id]))

  const epicNames = [...new Set(TASKS.map((t) => t.epic))]
  for (const epicName of epicNames) {
    if (existingTitles.has(epicName)) {
      console.log(`Epic already exists, skipping: ${epicName}`)
      continue
    }
    const [created] = await rest('POST', 'epics', { title: epicName, color: EPIC_COLORS[epicName] ?? '#4263eb', created_by: userId })
    epicMap[epicName] = created.id
    console.log(`Created epic: ${epicName}`)
  }

  // Insert all tasks.
  const taskRows = TASKS.map((task, i) => ({
    title: task.title,
    description: `${task.description}\n\n${task.explanation}`,
    status: task.status,
    priority: task.priority,
    epic_id: epicMap[task.epic],
    assignee_id: null,
    labels: task.labels,
    order: i,
    created_by: userId,
  }))

  await rest('POST', 'tasks', taskRows)
  console.log(`\nDone — inserted ${taskRows.length} tasks across ${epicNames.length} epics.`)
}

main()
