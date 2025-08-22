# Development Workflow

## 🎯 Branch Strategy

### Branch Structure

```
main (production) ← preview (staging) ← development (dev)
     🚀                   🔄                  🔧
```

| Branch        | Purpose                  | Deployment                | Direct Push       |
| ------------- | ------------------------ | ------------------------- | ----------------- |
| `development` | 🔧 Development & Testing | ❌ None                   | ✅ Allowed        |
| `preview`     | 🔄 Staging & Review      | ✅ Preview Environment    | ⚠️ Limited        |
| `main`        | 🚀 Production            | ✅ Production Environment | ❌ **Restricted** |

## 📋 Recommended Development Flow

### 1. Development Phase

```bash
# Start new feature/fix
git checkout development
git pull origin development

# Make changes
# ... your development work ...

# Commit and push
git add .
git commit -m "feat: implement new feature"
git push origin development
```

**Result**:

- ✅ GitHub Actions runs tests & linting
- ❌ No deployment (fast feedback)

### 2. Staging Phase

```bash
# Create PR: development → preview
# Via GitHub UI or:
gh pr create --base preview --head development --title "feat: new feature for review"
```

**Result**:

- ✅ Code review process
- ✅ Deploy to Preview environment
- ✅ Staging environment testing

### 3. Production Phase

```bash
# After preview testing, create PR: preview → main
gh pr create --base main --head preview --title "release: deploy to production"
```

**Result**:

- ✅ Final review & approval
- ✅ Deploy to Production environment
- ✅ Controlled production release

## 🔒 Branch Protection Setup

### Recommended GitHub Settings

#### Main Branch Protection

```
Repository Settings → Branches → Add protection rule

Branch pattern: main
☑️ Restrict pushes that create files
☑️ Require a pull request before merging
  ☑️ Require approvals (1+)
  ☑️ Dismiss stale PR approvals when new commits are pushed
  ☑️ Require review from code owners
☑️ Require status checks to pass before merging
  ☑️ Require branches to be up to date before merging
  ☑️ GitHub Actions workflows
☑️ Require conversation resolution before merging
☑️ Include administrators
```

#### Preview Branch Protection (Optional)

```
Branch pattern: preview
☑️ Require a pull request before merging
☑️ Require status checks to pass before merging
```

## 🚀 Quick Commands

### Development to Preview

```bash
# Method 1: GitHub CLI
gh pr create --base preview --head development

# Method 2: Git + GitHub UI
git push origin development
# Then create PR via GitHub web interface
```

### Preview to Production

```bash
# Method 1: GitHub CLI
gh pr create --base main --head preview

# Method 2: Git + GitHub UI
git push origin preview
# Then create PR via GitHub web interface
```

## ⚠️ Emergency Procedures

### Hotfix for Production

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Make minimal fix
# ... fix the critical issue ...

# 3. Push and create emergency PR
git push origin hotfix/critical-fix
gh pr create --base main --head hotfix/critical-fix --title "hotfix: critical production fix"

# 4. After merge, sync back to preview and development
git checkout preview
git pull origin main
git push origin preview

git checkout development
git pull origin preview
git push origin development
```

## 🔍 Workflow Validation

### Automated Checks

- ✅ **Development**: Tests & linting only
- ✅ **Preview PR**: Code validation + flow verification
- ✅ **Production PR**: Enhanced validation + deployment approval
- ⚠️ **Direct main push**: Warning + guidance

### Manual Reviews

- 📋 **Code Review**: Required for preview → main
- 🧪 **Staging Test**: Manual testing in preview environment
- ✅ **Production Approval**: Final sign-off before production

## 📊 Environment URLs

- **Development**: `http://localhost:3000`
- **Preview**: `https://zeus-git-preview-[team].vercel.app`
- **Production**: `https://zeus-[team].vercel.app`

## 🆘 Troubleshooting

### "Direct push to main" Warning

```
⚠️ WARNING: Direct push to main branch detected!

Solution:
1. Set up branch protection rules
2. Use PR workflow: preview → main
```

### Failed Status Checks

```
❌ Status checks failing

Solution:
1. Check GitHub Actions logs
2. Fix issues in development branch
3. Create new PR after fixes
```

### Deployment Issues

```
❌ Deployment not triggered

Check:
1. Vercel Git integration settings
2. Deploy hooks configuration
3. Environment variables setup
```
