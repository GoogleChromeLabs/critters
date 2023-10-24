/**
 * @module CSS
 *
 */

// Like [].filter(), but applies the opposite filtering result to a second copy of the Array without a second pass.
// This is just a quicker version of generating the compliment of the set returned from a filter operation.
export default async (a, b, Predicate) => {
	const aOut = [];
	const bOut = [];
	for (let index = 0; index < a.length; index++) {
		if (await Predicate(a[index], index, a, b)) {
			aOut.push(a[index]);
		} else {
			bOut.push(a[index]);
		}
	}
	return [aOut, bOut];
};
