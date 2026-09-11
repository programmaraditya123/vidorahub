const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, 'search.controller.js'), 'utf8');
const run = async (controller, query, responses) => {
    const calls = [];
    const sandbox = {
        module: { exports: {} }, console: { error() {}, warn() {} },
        require: () => ({ aggregate: async (pipeline) => {
            calls.push(pipeline);
            assert.ok(responses.length, 'Unexpected database call');
            const next = responses.shift();
            if (next instanceof Error) throw next;
            return next;
        } })
    };
    vm.runInNewContext(source, sandbox);
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await sandbox.module.exports[controller]({ query }, res);
    return { ...res, calls };
};
const matches = (total, results = [], categories = []) => [{ metadata: total ? [{ total }] : [], results, categories: categories.map(_id => ({ _id })) }];

test('returns up to ten ranked keyword suggestions, including for an empty query', async () => {
    for (const q of ['', 'a', 'music']) {
        const result = await run('getSearchKeywords', { q }, [[{ keyword: 'music' }]]);
        assert.equal(result.code, 200);
        assert.equal(result.body.keywords[0], 'music');
        assert.equal(result.calls[0].find(stage => stage.$limit).$limit, 10);
    }
});

test('matched videos retain pagination and do not request latest videos', async () => {
    const result = await run('getSearchResults', { q: 'music', page: '2', limit: '10' }, [matches(25, [{ title: 'music' }])]);
    assert.equal(result.body.total, 25);
    assert.equal(result.body.page, 2);
    assert.equal(result.body.hasMore, true);
    assert.equal(result.body.isFallback, false);
    assert.equal(result.calls.length, 1);
});

test('an out-of-range page is not treated as a search with no matches', async () => {
    const result = await run('getSearchResults', { q: 'unique', page: '5' }, [matches(2)]);
    assert.equal(result.body.count, 0);
    assert.equal(result.body.isFallback, false);
    assert.equal(result.calls.length, 1);
});

test('no matches returns message and latest twenty public videos', async () => {
    const result = await run('getSearchResults', { q: 'missing', page: '3', limit: '5' }, [matches(0), [{ title: 'latest' }]]);
    assert.equal(result.body.message, 'No video for this search');
    assert.equal(result.body.isFallback, true);
    assert.equal(result.body.total, 0);
    assert.equal(result.body.page, 1);
    assert.equal(result.body.limit, 20);
    assert.equal(result.body.results[0].title, 'latest');
    const fallback = result.calls[1];
    assert.equal(fallback[0].$match.visibility, 'public');
    assert.equal(fallback[0].$match.isDeleted.$ne, true);
    assert.equal(fallback[0].$match.isPaused.$ne, true);
    assert.equal(fallback[1].$sort.createdAt, -1);
    assert.equal(fallback[2].$limit, 20);
});

test('searches the collection directly with escaped literal keywords', async () => {
    const result = await run('getSearchResults', { q: 'a.*' }, [matches(1, [{ title: 'a.*' }])]);
    assert.equal(result.code, 200);
    assert.equal(result.body.isFallback, false);
    const regex = result.calls[0][0].$match.$or[0].title;
    assert.equal(regex.test('a.*'), true);
    assert.equal(regex.test('anything'), false);
});

test('empty query returns top videos and normalizes invalid pagination', async () => {
    const result = await run('getSearchResults', { page: '-1', limit: 'garbage' }, [matches(1, [{}])]);
    assert.equal(result.code, 200);
    assert.equal(result.body.page, 1);
    assert.equal(result.body.limit, 20);
    assert.equal(result.calls[0][0].$match.visibility, 'public');
});

test('empty catalog produces an empty fallback successfully', async () => {
    const result = await run('getSearchResults', { q: 'missing' }, [matches(0), []]);
    assert.equal(result.code, 200);
    assert.equal(result.body.count, 0);
    assert.equal(result.body.isFallback, true);
});

test('database errors are not misreported as no matches', async () => {
    const result = await run('getSearchResults', { q: 'music' }, [new Error('Connection timed out')]);
    assert.equal(result.code, 500);
    assert.equal(result.calls.length, 1);
});

test('overlong queries are rejected before database access', async () => {
    for (const controller of ['getSearchResults', 'getSearchKeywords']) {
        const result = await run(controller, { q: 'x'.repeat(201) }, []);
        assert.equal(result.code, 400);
        assert.equal(result.calls.length, 0);
    }
});

const helpers = (() => {
    const context = { module: { exports: {} }, require: () => ({}) };
    vm.createContext(context);
    vm.runInContext(source, context);
    return vm.runInContext('({ databaseSearch, getRelatedCategories, rankedResults })', context);
})();

// Evaluate the generated match conditions against fixtures to check recall across fields.
const matchesFilter = (document, filter) => Object.entries(filter).every(([field, value]) => {
    if (field === '$or') return value.some(item => matchesFilter(document, item));
    if (value && Object.prototype.hasOwnProperty.call(value, '$ne')) return document[field] !== value.$ne;
    if (value && typeof value.test === 'function') {
        const values = Array.isArray(document[field]) ? document[field] : [document[field]];
        return values.some(item => typeof item === 'string' && value.test(item));
    }
    return document[field] === value;
});
const publicVideo = { isDeleted: false, isPaused: false, visibility: 'public' };

test('finds all ten videos across title, description, tags and AI tags', () => {
    const fixtures = [
        { title: 'Krishna song' }, { title: 'SONG Krishna' },
        { description: 'A Krishna performance' }, { description: 'A new SONG' },
        { tags: ['krishna'] }, { tags: ['song'] },
        { aitags: ['KRISHNA'] }, { aitags: ['song'] },
        { title: 'Krishna', description: 'song' }, { tags: ['song'], aitags: ['krishna'] }
    ].map(item => ({ ...publicVideo, ...item }));
    const filter = helpers.databaseSearch('Krishna song')[0].$match;
    assert.equal(fixtures.filter(item => matchesFilter(item, filter)).length, 10);
    assert.equal(matchesFilter({ ...publicVideo, title: 'unrelated' }, filter), false);
    for (const flags of [{ isDeleted: true }, { isPaused: true }, { visibility: 'private' }]) {
        assert.equal(matchesFilter({ ...fixtures[0], ...flags }, filter), false);
    }
});

test('supports Unicode keywords and avoids duplicate keyword scoring', () => {
    const pipeline = helpers.databaseSearch('????? ??? ?????');
    assert.equal(pipeline[0].$match.$or.length, 10);
    assert.equal(matchesFilter({ ...publicVideo, aitags: ['???'] }, pipeline[0].$match), true);
});

test('sparse direct matches expand to related categories with direct matches sorted first', async () => {
    const result = await run('getSearchResults', { q: 'krishna' }, [
        matches(2, [], ['Bhajan']), matches(12, [{ title: 'Krishna', isRelated: false }, { category: 'Music', isRelated: true }])
    ]);
    assert.equal(result.code, 200);
    assert.equal(result.body.directTotal, 2);
    assert.equal(result.body.relatedTotal, 10);
    assert.ok(result.body.relatedCategories.includes('spiritual'));
    const filter = result.calls[1][0].$match;
    assert.equal(matchesFilter({ ...publicVideo, category: 'Music' }, filter), true);
    assert.equal(matchesFilter({ ...publicVideo, category: 'Gaming' }, filter), false);
    const sort = result.calls[1].find(stage => stage.$facet).$facet.results[0].$sort;
    assert.equal(Object.keys(sort)[0], 'isRelated');
    assert.equal(sort.isRelated, 1);
    assert.equal(sort.matchedKeywords, -1);
});

test('category query expands even without direct matches; All does not expand', async () => {
    const result = await run('getSearchResults', { q: 'Bhajan' }, [matches(0), matches(3, [{ category: 'Spiritual' }])]);
    assert.equal(result.body.isFallback, false);
    assert.equal(result.body.relatedTotal, 3);
    const all = await run('getSearchResults', { q: 'All' }, [matches(30)]);
    assert.equal(all.calls.length, 1);
    assert.equal(all.calls[0][0].$match.$or, undefined);
});

test('enough direct matches do not trigger expansion', async () => {
    const result = await run('getSearchResults', { q: 'bhajan', limit: '50' }, [matches(22)]);
    assert.equal(result.calls.length, 1);
    assert.equal(result.body.relatedTotal, 0);
});

test('category relations are normalized and stay one hop', () => {
    const related = helpers.getRelatedCategories('recipe', [{ _id: 'Food_Vlogs' }]);
    assert.ok(related.includes('cooking'));
    assert.ok(related.includes('travel'));
    assert.equal(related.includes('fashion'), false);
    assert.equal(helpers.getRelatedCategories('unrelated', []).length, 0);
    assert.ok(helpers.getRelatedCategories('Live', []).includes('gaming'));
    assert.equal(helpers.getRelatedCategories('Live', []).includes('cooking'), false);
});

test('related results share one stable paginated set without duplicating direct matches', async () => {
    const result = await run('getSearchResults', { q: 'krishna', page: '2', limit: '5' }, [
        matches(2, [], ['Bhajan']), matches(12, [{ category: 'Music', isRelated: true }])
    ]);
    assert.equal(result.body.page, 2);
    assert.equal(result.body.total, 12);
    assert.equal(result.body.hasMore, true);
    const pipeline = result.calls[1];
    assert.equal(pipeline.filter(stage => stage.$match).length, 1);
    assert.equal(pipeline.some(stage => stage.$unionWith || stage.$unwind), false);
    const pageStages = pipeline.find(stage => stage.$facet).$facet.results;
    assert.equal(pageStages[1].$skip, 5);
    assert.equal(pageStages[2].$limit, 5);
});

test('field priority is strict even when lower-priority results are more popular', () => {
    const sort = helpers.rankedResults(1, 20).find(stage => stage.$facet).$facet.results[0].$sort;
    assert.deepEqual(Object.keys(sort).slice(0, 6), [
        'isRelated', 'keywordMatches.title', 'keywordMatches.description',
        'keywordMatches.tags', 'keywordMatches.aitags', 'keywordMatches.category'
    ]);
    const fixtures = [
        { id: 'ai', keywordMatches: { aitags: 2 }, popularityScore: 1000000 },
        { id: 'tags', keywordMatches: { tags: 1 }, popularityScore: 100000 },
        { id: 'description', keywordMatches: { description: 1 }, popularityScore: 10000 },
        { id: 'title', keywordMatches: { title: 1 }, popularityScore: 0 },
        { id: 'all-title-keywords', keywordMatches: { title: 2 }, popularityScore: 0 }
    ];
    const read = (item, field) => field.split('.').reduce((value, key) => value?.[key], item) || 0;
    fixtures.sort((a, b) => {
        for (const [field, direction] of Object.entries(sort)) {
            const difference = (read(a, field) - read(b, field)) * direction;
            if (difference) return difference;
        }
        return 0;
    });
    assert.deepEqual(fixtures.map(item => item.id), ['all-title-keywords', 'title', 'description', 'tags', 'ai']);
});

test('each distinct keyword is checked independently in every prioritized field', () => {
    const counts = helpers.databaseSearch('Krishna song Krishna')[1].$set.keywordMatches;
    assert.deepEqual(Object.keys(counts), ['title', 'description', 'tags', 'aitags', 'category']);
    for (const [field, expression] of Object.entries(counts)) {
        assert.equal(expression.$add.length, 2);
        const checks = expression.$add.map(item => item.$cond[0]);
        const regexChecks = checks.map(check => ['tags', 'aitags'].includes(field)
            ? check.$anyElementTrue[0].$map.in.$regexMatch : check.$regexMatch);
        assert.equal(regexChecks[0].regex.test('KRISHNA'), true);
        assert.equal(regexChecks[1].regex.test('song'), true);
        assert.equal(regexChecks[0].regex.test('unrelated'), false);
    }
});

test('gita search includes all ten parts when older uploads lack status flags', () => {
    const parts = Array.from({ length: 10 }, (_, index) => ({
        _id: String(index + 1), title: `Gita part ${index + 1}`, visibility: 'public',
        ...(index >= 8 ? { isDeleted: false, isPaused: false } : {})
    }));
    const filter = helpers.databaseSearch('gita')[0].$match;
    assert.equal(parts.filter(video => matchesFilter(video, filter)).length, 10);
    for (const status of [
        { isDeleted: true }, { isPaused: true }, { visibility: 'private' },
        { visibility: 'unlisted' }, { visibility: undefined }
    ]) {
        assert.equal(matchesFilter({ ...parts[0], ...status }, filter), false);
    }
});
