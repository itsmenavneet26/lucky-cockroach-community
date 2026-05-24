# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> a11y: /login has no WCAG 2.2 AA violations
- Location: tests/e2e/a11y.spec.ts:21:7

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link "Lucky Cockroach Community — home" [ref=e5] [cursor=pointer]:
          - /url: /
          - img [ref=e7]
          - generic [ref=e9]:
            - generic [ref=e10]: LUCKY
            - generic [ref=e11]: COCKROACH
        - generic [ref=e12]:
          - img
          - searchbox "Search posts, topics, and people" [ref=e13]
        - generic [ref=e14]:
          - link "Create Post" [ref=e15] [cursor=pointer]:
            - /url: /login
            - button "Create Post" [ref=e16]:
              - img [ref=e17]
              - text: Create Post
          - button "Switch to dark mode" [ref=e19]:
            - img [ref=e20]
          - link "Sign in" [ref=e22] [cursor=pointer]:
            - /url: /login
            - button "Sign in" [ref=e23]
    - generic [ref=e24]:
      - generic [ref=e28]:
        - generic [ref=e29]:
          - heading "For students. By students. For change." [level=1] [ref=e30]:
            - text: For students.
            - text: By students.
            - text: For change.
          - paragraph [ref=e32]: The community of the Lucky Cockroach movement — 100,000 students and unemployed youth standing against paper leaks, recruitment delays, and exam fraud. Share your fight. You are not alone.
        - generic [ref=e33]:
          - generic [ref=e34]:
            - img [ref=e36]
            - paragraph [ref=e41]: 100K
            - paragraph [ref=e42]: Cockroaches strong
          - generic [ref=e43]:
            - img [ref=e45]
            - paragraph [ref=e48]: 29 States
            - paragraph [ref=e49]: One movement
          - generic [ref=e50]:
            - img [ref=e52]
            - paragraph [ref=e55]: Safe Space
            - paragraph [ref=e56]: Support, not politics
      - main [ref=e57]:
        - generic [ref=e59]:
          - link "New here? Sign up" [ref=e61] [cursor=pointer]:
            - /url: /signup
            - text: New here?
            - generic [ref=e62]: Sign up
            - img [ref=e63]
          - generic [ref=e65]:
            - generic [ref=e66]: 👋
            - heading "Welcome back, Lucky Cockroach" [level=1] [ref=e67]:
              - text: Welcome back,
              - text: Lucky Cockroach
            - paragraph [ref=e69]: Sign in to continue to the community.
          - generic [ref=e70]:
            - generic [ref=e71]:
              - generic [ref=e72]: Email or Username
              - generic [ref=e73]:
                - img [ref=e75]
                - textbox "Email or Username" [ref=e78]:
                  - /placeholder: Enter your email or username
            - generic [ref=e79]:
              - generic [ref=e80]:
                - generic [ref=e81]: Password
                - generic [ref=e82]:
                  - img [ref=e84]
                  - textbox "Password Show password" [ref=e87]:
                    - /placeholder: Enter your password
                  - button "Show password" [ref=e88]:
                    - img [ref=e89]
              - link "Forgot password?" [ref=e93] [cursor=pointer]:
                - /url: /forgot-password
            - button "Sign in" [ref=e94]:
              - text: Sign in
              - img [ref=e95]
          - generic [ref=e99]: OR
          - button "Continue with Google" [ref=e101]:
            - img [ref=e102]
            - text: Continue with Google
          - paragraph [ref=e107]:
            - text: 🔒 By continuing, you agree to our
            - link "Terms of Service" [ref=e108] [cursor=pointer]:
              - /url: /guidelines
            - text: and
            - link "Privacy Policy" [ref=e109] [cursor=pointer]:
              - /url: /guidelines
            - text: .
  - button "Open Next.js Dev Tools" [ref=e115] [cursor=pointer]:
    - img [ref=e116]
  - alert [ref=e119]
```