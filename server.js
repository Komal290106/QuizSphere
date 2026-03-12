const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: 'quizsphere-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

// Make user available to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============ HELPER FUNCTIONS ============

// Read quizzes.json
const getQuizzesData = () => {
    try {
        const data = fsSync.readFileSync(
            path.join(__dirname, 'data', 'quizzes.json'),
            'utf8'
        );
        return JSON.parse(data);
    } catch (error) {
        console.error("JSON READ ERROR:", error);
        return { subjects: [] };
    }
};

// Read users from file
async function readUsers() {
    try {
        const filePath = path.join(__dirname, 'data', 'users.json');
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Write users to file
async function writeUsers(users) {
    try {
        const filePath = path.join(__dirname, 'data', 'users.json');
        await fs.writeFile(
            filePath,
            JSON.stringify(users, null, 2)
        );
    } catch (error) {
        console.error('Error writing users file:', error.message);
    }
}

// Validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateRollNumber(rollNumber) {
    return rollNumber && rollNumber.length >= 3;
}

function validatePassword(password) {
    return password && password.length >= 3;
}

function validateName(name) {
    return name && name.length >= 2;
}

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// ============ AUTH ROUTES ============

// Home route - redirect to dashboard
app.get('/', requireAuth, (req, res) => {
    res.redirect('/dashboard');
});

// Dashboard (protected)
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', { 
        user: req.session.user,
        title: 'Dashboard'
    });
});

// Profile page
app.get('/profile', requireAuth, (req, res) => {
    res.render('profile', { 
        user: req.session.user,
        title: 'My Profile'
    });
});

// Signup page
app.get('/signup', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('signup', { 
        error: null,
        formData: {},
        title: 'Sign Up'
    });
});

// Signup form submission
app.post('/signup', async (req, res) => {
    const { name, rollNumber, email, password, confirmPassword } = req.body;
    
    // Validation
    if (!name || !rollNumber || !email || !password || !confirmPassword) {
        return res.render('signup', { 
            error: 'All fields are required',
            formData: req.body,
            title: 'Sign Up'
        });
    }

    if (!validateName(name)) {
        return res.render('signup', { 
            error: 'Name must be at least 2 characters long',
            formData: req.body,
            title: 'Sign Up'
        });
    }

    if (!validateRollNumber(rollNumber)) {
        return res.render('signup', { 
            error: 'Roll number must be at least 3 characters long',
            formData: req.body,
            title: 'Sign Up'
        });
    }

    if (!validateEmail(email)) {
        return res.render('signup', { 
            error: 'Please enter a valid email address',
            formData: req.body,
            title: 'Sign Up'
        });
    }

    if (!validatePassword(password)) {
        return res.render('signup', { 
            error: 'Password must be at least 3 characters long',
            formData: req.body,
            title: 'Sign Up'
        });
    }

    if (password !== confirmPassword) {
        return res.render('signup', { 
            error: 'Passwords do not match',
            formData: req.body,
            title: 'Sign Up'
        });
    }

    // Check for duplicate email/roll number
    const users = await readUsers();
    const existingUser = users.find(user => 
        user.email === email || user.rollNumber === rollNumber
    );
    
    if (existingUser) {
        if (existingUser.email === email) {
            return res.render('signup', { 
                error: 'Email already registered. Please use a different email or login.',
                formData: req.body,
                title: 'Sign Up'
            });
        }
        if (existingUser.rollNumber === rollNumber) {
            return res.render('signup', { 
                error: 'Roll number already registered. Please use a different roll number or login.',
                formData: req.body,
                title: 'Sign Up'
            });
        }
    }

    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        email: email.trim().toLowerCase(),
        password: password
    };

    users.push(newUser);
    await writeUsers(users);
    
    res.redirect('/login?registered=true');
});

// Login page
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { 
        error: null,
        success: req.query.registered ? 'Registration successful! Please login.' : null,
        formData: {},
        title: 'Login'
    });
});

// Login form submission
app.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.render('login', { 
            error: 'Please provide both email/roll number and password',
            formData: req.body,
            title: 'Login'
        });
    }

    const users = await readUsers();
    
    if (users.length === 0) {
        return res.render('login', { 
            error: 'No users found. Please sign up first.',
            formData: req.body,
            title: 'Login'
        });
    }
    
    const user = users.find(u => 
        (u.email === identifier.toLowerCase().trim() || u.rollNumber === identifier.trim()) && 
        u.password === password
    );

    if (!user) {
        return res.render('login', { 
            error: 'Invalid email/roll number or password',
            formData: req.body,
            title: 'Login'
        });
    }

    req.session.user = {
        id: user.id,
        name: user.name,
        rollNumber: user.rollNumber,
        email: user.email
    };

    res.redirect('/');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// ============ QUIZ ROUTES (ALL PROTECTED) ============

// Quiz List (protected)
app.get('/quiz', requireAuth, (req, res) => {
    const quizzesData = getQuizzesData();

    res.render('quiz-list', {
        subjects: quizzesData.subjects,
        pageTitle: 'Available Quizzes',
        user: req.session.user
    });
});

// Quiz Details (protected)
app.get('/quiz/:id', requireAuth, (req, res) => {
    const quizId = parseInt(req.params.id);
    const quizzesData = getQuizzesData();

    let foundQuiz = null;
    let foundSubject = null;

    for (const subject of quizzesData.subjects) {
        const quiz = subject.quizzes.find(q => q.id === quizId);
        if (quiz) {
            foundQuiz = quiz;
            foundSubject = subject.name;
            break;
        }
    }

    if (foundQuiz) {
        res.render('quiz-details', {
            quiz: foundQuiz,
            subject: foundSubject,
            user: req.session.user
        });
    } else {
        res.status(404).send('Quiz not found');
    }
});

// Quiz Attempt (protected)
app.get('/quiz/:id/attempt', requireAuth, (req, res) => {
    const quizId = parseInt(req.params.id);
    const quizzesData = getQuizzesData();

    let foundQuiz = null;

    for (const subject of quizzesData.subjects) {
        const quiz = subject.quizzes.find(q => q.id === quizId);
        if (quiz) {
            foundQuiz = quiz;
            break;
        }
    }

    if (foundQuiz) {
        res.render('attempt', {
            quiz: foundQuiz,
            questions: foundQuiz.questions ?? [],
            user: req.session.user
        });
    } else {
        res.status(404).send('Quiz not found');
    }
});

// About page (public - no login required)
app.get('/about', (req, res) => {
    res.render('about', {
        user: req.session.user || null,
        title: 'About QuizSphere'
    });
});

// ============ RESULT AND REVIEW ROUTES ============

// Result page
app.get('/result/:id', requireAuth, (req, res) => {
    const quizId = parseInt(req.params.id);
    const quizzesData = getQuizzesData();
    const answersParam = req.query.answers || '';
    
    // Convert answers string to array - handle -1 as null (unattempted)
    const answers = answersParam.split(',').map(a => {
        if (a === '-1' || a === '') return null;
        return parseInt(a);
    });
    
    console.log('Result page - Answers:', answers); // Debug log
    
    let foundQuiz = null;
    
    for (const subject of quizzesData.subjects) {
        const quiz = subject.quizzes.find(q => q.id === quizId);
        if (quiz) {
            foundQuiz = quiz;
            break;
        }
    }
    
    if (foundQuiz) {
        res.render('result', {
            quiz: foundQuiz,
            answers: answers,
            user: req.session.user,
            title: 'Quiz Result'
        });
    } else {
        res.status(404).send('Quiz not found');
    }
});

// Review page
app.get('/review/:id', requireAuth, (req, res) => {
    const quizId = parseInt(req.params.id);
    const quizzesData = getQuizzesData();
    const answersParam = req.query.answers || '';
    
    // Convert answers string to array - handle -1 as null (unattempted)
    const answers = answersParam.split(',').map(a => {
        if (a === '-1' || a === '') return null;
        return parseInt(a);
    });
    
    console.log('Review page - Answers:', answers); // Debug log
    
    let foundQuiz = null;
    
    for (const subject of quizzesData.subjects) {
        const quiz = subject.quizzes.find(q => q.id === quizId);
        if (quiz) {
            foundQuiz = quiz;
            break;
        }
    }
    
    if (foundQuiz) {
        res.render('review', {
            quiz: foundQuiz,
            answers: answers,
            user: req.session.user,
            title: 'Review Answers'
        });
    } else {
        res.status(404).send('Quiz not found');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`QuizSphere with authentication enabled`);
});