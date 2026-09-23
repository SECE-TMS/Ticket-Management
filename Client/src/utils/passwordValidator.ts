export interface PasswordRule {
  id: string
  label: string
  passed: boolean
}

export interface PasswordValidationResult {
  isValid: boolean
  score: number // 0 to 4
  strengthLabel: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong'
  strengthColor: string // CSS color class or hex
  strengthProgress: number // 0 to 100
  rules: PasswordRule[]
  errors: string[]
}

export const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (pw: string) => pw.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'At least 1 uppercase letter (A-Z)',
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    id: 'lowercase',
    label: 'At least 1 lowercase letter (a-z)',
    test: (pw: string) => /[a-z]/.test(pw),
  },
  {
    id: 'number',
    label: 'At least 1 number (0-9)',
    test: (pw: string) => /[0-9]/.test(pw),
  },
  {
    id: 'special',
    label: 'At least 1 special character (!@#$%^&*...)',
    test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
  },
]

export function validatePassword(password: string): PasswordValidationResult {
  const rules = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(password),
  }))

  const passedCount = rules.filter((r) => r.passed).length
  const errors = rules.filter((r) => !r.passed).map((r) => r.label)
  const isValid = passedCount === rules.length

  let score = 0
  let strengthLabel: PasswordValidationResult['strengthLabel'] = 'Very Weak'
  let strengthColor = 'bg-red-500'

  if (password.length === 0) {
    score = 0
    strengthLabel = 'Very Weak'
    strengthColor = 'bg-slate-300'
  } else if (passedCount <= 1) {
    score = 1
    strengthLabel = 'Very Weak'
    strengthColor = 'bg-red-500'
  } else if (passedCount === 2) {
    score = 2
    strengthLabel = 'Weak'
    strengthColor = 'bg-orange-500'
  } else if (passedCount === 3) {
    score = 3
    strengthLabel = 'Fair'
    strengthColor = 'bg-amber-500'
  } else if (passedCount === 4) {
    score = 4
    strengthLabel = 'Strong'
    strengthColor = 'bg-blue-600'
  } else {
    score = 5
    strengthLabel = 'Very Strong'
    strengthColor = 'bg-emerald-600'
  }

  const strengthProgress = password.length === 0 ? 0 : Math.round((passedCount / rules.length) * 100)

  return {
    isValid,
    score,
    strengthLabel,
    strengthColor,
    strengthProgress,
    rules,
    errors,
  }
}
