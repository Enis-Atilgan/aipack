# IAM Policy Security Analyzer Skill

## Purpose
Analyze AWS IAM policies, SCPs, and resource policies to detect privilege escalation pathways.

## Assessment Matrix
- PassRole privileges paired with lambda:CreateFunction or ec2:RunInstances.
- sts:AssumeRole permissions lacking condition constraints.
- Admin policy attachments to non-breakglass roles.
